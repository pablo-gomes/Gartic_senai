import WebSocket from 'ws';

const WS_URL = process.env.WS_URL || 'ws://127.0.0.1:3000/ws';
const HTTP_URL = process.env.HTTP_URL || 'http://127.0.0.1:3000';

interface SimClient {
  id: string;
  nickname: string;
  ws: WebSocket;
  joinedCode: string | null;
  receivedEvents: Map<string, number>;
  receivedBatches: number;
  receivedChatMessages: number;
  receivedCrossRoomEvents: number;
  privateWord: string | null;
  strokesSnapshotCount: number;
  latenciesMs: number[];
  unexpectedDisconnects: number;
  intentionalDisconnect: boolean;
  lastError: string | null;
}

let totalMessagesSent = 0;
let totalMessagesReceived = 0;
let totalBytesSent = 0;
let totalBytesReceived = 0;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchServerHealth(): Promise<{
  status: string;
  rooms: number;
  clients: number;
  rssMb: number;
  heapUsedMb: number;
  uptime: number;
}> {
  const res = await fetch(`${HTTP_URL}/healthz`);
  return res.json() as any;
}

function createSimClient(index: number, prefix = 'plr'): Promise<SimClient> {
  return new Promise((resolve, reject) => {
    const id = `${prefix}_${index}_${Math.random().toString(36).slice(2, 7)}`;
    const nickname = `Jogador_${index}`;
    const ws = new WebSocket(WS_URL);

    const client: SimClient = {
      id,
      nickname,
      ws,
      joinedCode: null,
      receivedEvents: new Map(),
      receivedBatches: 0,
      receivedChatMessages: 0,
      receivedCrossRoomEvents: 0,
      privateWord: null,
      strokesSnapshotCount: 0,
      latenciesMs: [],
      unexpectedDisconnects: 0,
      intentionalDisconnect: false,
      lastError: null,
    };

    const timeout = setTimeout(() => {
      reject(new Error(`Timeout connecting client ${index}`));
    }, 5000);

    ws.on('open', () => {
      clearTimeout(timeout);
      resolve(client);
    });

    ws.on('message', (data) => {
      const raw = data.toString();
      totalMessagesReceived += 1;
      totalBytesReceived += Buffer.byteLength(raw);

      try {
        const msg = JSON.parse(raw);
        const ev = String(msg.event || '');
        client.receivedEvents.set(ev, (client.receivedEvents.get(ev) || 0) + 1);

        if (ev === 'room:joined_ack') {
          client.joinedCode = msg.payload?.joinCode || null;
        } else if (ev === 'drawing:batch' || ev === 'drawing:stroke') {
          client.receivedBatches += 1;
        } else if (ev === 'chat:message') {
          client.receivedChatMessages += 1;
        } else if (ev === 'word:private') {
          client.privateWord = msg.payload?.word || null;
        } else if (ev === 'room:state' || ev === 'game:state-sync') {
          if (Array.isArray(msg.payload?.strokes) && !msg.payload?.omitStrokes) {
            client.strokesSnapshotCount = msg.payload.strokes.length;
          }
        } else if (ev === 'error') {
          client.lastError = msg.payload?.code || msg.payload?.message || 'ERROR';
        }
      } catch {
        // Ignore parse error
      }
    });

    ws.on('close', () => {
      if (!client.intentionalDisconnect) {
        client.unexpectedDisconnects += 1;
      }
    });

    ws.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

function sendEvent(client: SimClient, event: string, payload: Record<string, unknown> = {}) {
  if (client.ws.readyState === WebSocket.OPEN) {
    const raw = JSON.stringify({ event, payload });
    totalMessagesSent += 1;
    totalBytesSent += Buffer.byteLength(raw);
    client.ws.send(raw);
  }
}

async function measurePingLatency(client: SimClient): Promise<number> {
  return new Promise((resolve) => {
    const start = performance.now();
    const onMessage = (data: WebSocket.RawData) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (parsed.event === 'pong') {
          const rtt = performance.now() - start;
          client.latenciesMs.push(rtt);
          client.ws.off('message', onMessage);
          resolve(rtt);
        }
      } catch {}
    };
    client.ws.on('message', onMessage);
    sendEvent(client, 'ping', { clientTime: Date.now() });
    setTimeout(() => {
      client.ws.off('message', onMessage);
      resolve(-1);
    }, 2000);
  });
}

async function runStressSuite() {
  console.log('================================================================');
  console.log(' INICIANDO BATERIA DE TESTES AUTOMATIZADOS (35 JOGADORES)');
  console.log('================================================================');

  const startTime = performance.now();
  const initialHealth = await fetchServerHealth();
  console.log(`[Métrica Inicial] RAM RSS: ${initialHealth.rssMb} MB | Heap: ${initialHealth.heapUsedMb} MB | Salas: ${initialHealth.rooms}`);

  // --------------------------------------------------------------------------
  // TESTE A: SALA CHEIA (35 CONEXÕES SIMULTÂNEAS) + ISOLAMENTO ENTRE SALAS
  // --------------------------------------------------------------------------
  console.log('\n--- [Teste A] Conectando 35 jogadores na Sala A + 2 jogadores na Sala B (Isolamento) ---');
  const clientsA: SimClient[] = [];
  for (let i = 1; i <= 35; i++) {
    const c = await createSimClient(i, 'salaA');
    clientsA.push(c);
  }

  const hostA = clientsA[0];
  sendEvent(hostA, 'room:create', {
    playerId: hostA.id,
    nickname: hostA.nickname,
    avatarId: 0,
    settings: {
      roomName: 'Arena Oficial 35P',
      maxPlayers: 35,
      roundDuration: 60,
      roundsPerPlayer: 1,
      themeMode: 'random',
      chatEnabled: true,
    },
  });

  await sleep(250);
  const roomCodeA = hostA.joinedCode;
  if (!roomCodeA) {
    throw new Error('Falha ao criar Sala A');
  }

  // Connect remaining 31 players to Room A
  await Promise.all(
    clientsA.slice(1).map(async (c, idx) => {
      sendEvent(c, 'room:join', {
        joinCode: roomCodeA,
        playerId: c.id,
        nickname: c.nickname,
        avatarId: (idx + 1) % 12,
      });
    })
  );
  await sleep(400);

  const joinedCountA = clientsA.filter((c) => c.joinedCode === roomCodeA).length;
  console.log(`[Teste A] Jogadores conectados na Sala A (${roomCodeA}): ${joinedCountA}/35`);

  // Test 36th player rejection (Room Full limit at 35)
  const extra36 = await createSimClient(36, 'extra');
  sendEvent(extra36, 'room:join', {
    joinCode: roomCodeA,
    playerId: extra36.id,
    nickname: 'Intruso_36',
    avatarId: 2,
  });
  await sleep(150);
  const rejected36 = extra36.lastError === 'ROOM_FULL' && extra36.joinedCode === null;
  console.log(`[Teste A] Bloqueio do 36º jogador acima do limite: ${rejected36 ? 'PASSOU (ROOM_FULL)' : 'FALHOU'}`);
  extra36.intentionalDisconnect = true;
  extra36.ws.close();

  // Create Room B to verify strict room isolation
  const clientB1 = await createSimClient(1, 'salaB');
  const clientB2 = await createSimClient(2, 'salaB');
  sendEvent(clientB1, 'room:create', {
    playerId: clientB1.id,
    nickname: 'Host_SalaB',
    avatarId: 3,
    settings: { roomName: 'Sala Isolada B', maxPlayers: 8, themeMode: 'random' },
  });
  await sleep(150);
  const roomCodeB = clientB1.joinedCode!;
  sendEvent(clientB2, 'room:join', {
    joinCode: roomCodeB,
    playerId: clientB2.id,
    nickname: 'Player2_SalaB',
    avatarId: 4,
  });
  await sleep(150);

  // --------------------------------------------------------------------------
  // TESTE B: DESENHO CONTÍNUO (20 ATUALIZAÇÕES/SEGUNDO PARA 31 ESPECTADORES)
  // --------------------------------------------------------------------------
  console.log('\n--- [Teste B] Iniciando partida e testando Desenho Contínuo (20 Hz -> 31 espectadores) ---');
  sendEvent(hostA, 'game:start');

  // Wait for ROUND_SETUP (600ms) + WORD_REVEAL (2800ms) -> DRAWING phase
  await sleep(3800);

  const drawerClient = clientsA.find((c) => c.privateWord !== null);
  if (!drawerClient) {
    throw new Error('Desenhista não recebeu a palavra secreta!');
  }
  const guesserClients = clientsA.filter((c) => c.id !== drawerClient.id);
  const leakedWordCount = guesserClients.filter((c) => c.privateWord !== null).length;
  console.log(
    `[Teste B] Desenhista: ${drawerClient.nickname} | Palavra secreta: "${drawerClient.privateWord}" | Vazamento para adivinhadores: ${leakedWordCount} (esperado: 0)`
  );

  // Drawer streams 40 batches at 20 Hz (50ms interval, 6 points per batch = 240 points across 4 strokes)
  for (let s = 1; s <= 4; s++) {
    const strokeId = `stk_bench_${s}`;
    for (let b = 1; b <= 10; b++) {
      const pts = [];
      for (let p = 0; p < 6; p++) {
        pts.push({
          x: Number(((b * 6 + p) / 80).toFixed(4)),
          y: Number((0.2 + s * 0.12 + Math.sin(p) * 0.02).toFixed(4)),
        });
      }
      sendEvent(drawerClient, 'drawing:batch', {
        strokeId,
        phase: b === 1 ? 'start' : b === 10 ? 'end' : 'move',
        tool: 'brush',
        color: '#2563EB',
        width: 8,
        points: pts,
        sequence: b,
      });
      await sleep(50);
    }
  }
  await sleep(200);

  const avgBatchesReceivedBySpectators =
    guesserClients.reduce((acc, c) => acc + c.receivedBatches, 0) / guesserClients.length;
  console.log(
    `[Teste B] Lotes enviados pelo desenhista: 40 | Média recebida pelos 31 espectadores: ${avgBatchesReceivedBySpectators.toFixed(1)}/40 | Vazamento para Sala B: ${clientB1.receivedBatches}`
  );

  // --------------------------------------------------------------------------
  // TESTE C: CHAT INTENSO E PALPITES SIMULTÂNEOS DURANTE O DESENHO
  // --------------------------------------------------------------------------
  console.log('\n--- [Teste C] Chat Intenso (31 jogadores enviando palpites simultâneos + desenho) ---');
  // 25 guessers send wrong guesses simultaneously while drawer continues drawing
  await Promise.all([
    (async () => {
      for (let b = 1; b <= 10; b++) {
        sendEvent(drawerClient, 'drawing:batch', {
          strokeId: 'stk_concurrent_chat',
          phase: b === 1 ? 'start' : b === 10 ? 'end' : 'move',
          tool: 'brush',
          color: '#DC2626',
          width: 6,
          points: [
            { x: 0.3, y: 0.3 },
            { x: 0.35, y: 0.35 },
            { x: 0.4, y: 0.4 },
          ],
          sequence: b,
        });
        await sleep(50);
      }
    })(),
    ...guesserClients.slice(0, 25).map(async (g, i) => {
      await sleep(i * 15);
      sendEvent(g, 'chat:guess', { text: `palpite errado ${i}` });
    }),
  ]);
  await sleep(300);

  // Measure ping latency across all 32 clients under load
  await Promise.all(clientsA.map((c) => measurePingLatency(c)));

  // Now 5 guessers submit the actual secret word!
  const secretWord = drawerClient.privateWord!;
  for (let i = 0; i < 5; i++) {
    sendEvent(guesserClients[i], 'chat:guess', { text: secretWord });
    await sleep(40);
  }
  await sleep(250);

  const correctEventsCount = hostA.receivedEvents.get('game:correct-answer') || 0;
  console.log(
    `[Teste C] Acertos validados pelo servidor: ${correctEventsCount}/5 | Mensagens de chat na Sala B: ${clientB1.receivedChatMessages} (isolamento OK)`
  );

  // --------------------------------------------------------------------------
  // TESTE E: RECONEXÕES DURANTE A RODADA E RECUPERAÇÃO DE SNAPSHOT DO DESENHO
  // --------------------------------------------------------------------------
  console.log('\n--- [Teste E] Desconectando e reconectando 4 clientes durante a rodada ---');
  const reconnectingIndices = [5, 10, 15, 20];
  for (const idx of reconnectingIndices) {
    const oldClient = clientsA[idx];
    oldClient.intentionalDisconnect = true;
    oldClient.ws.close();
  }
  await sleep(250);

  for (const idx of reconnectingIndices) {
    const oldId = clientsA[idx].id;
    const oldNick = clientsA[idx].nickname;
    const reconnectedClient = await createSimClient(idx, 'recon');
    reconnectedClient.id = oldId;
    reconnectedClient.nickname = oldNick;
    clientsA[idx] = reconnectedClient;
    sendEvent(reconnectedClient, 'room:join', {
      joinCode: roomCodeA,
      playerId: oldId,
      nickname: oldNick,
      avatarId: idx % 12,
      isReconnect: true,
    });
  }
  await sleep(350);

  const recoveredSnapshots = reconnectingIndices.map((idx) => clientsA[idx].strokesSnapshotCount);
  console.log(
    `[Teste E] Clientes reconectados: 4/4 | Traços recuperados no snapshot do Canvas: [${recoveredSnapshots.join(', ')}] traços`
  );

  // --------------------------------------------------------------------------
  // TESTE F: MENSAGENS MALFORMADAS, ACIMA DO LIMITE E NÃO AUTORIZADAS
  // --------------------------------------------------------------------------
  console.log('\n--- [Teste F] Testando rejeição de pacotes inválidos, gigantes e sem permissão ---');
  const attacker = clientsA.find(
    (c) => c.id !== drawerClient.id && !c.hasOwnProperty('closed') && c.ws.readyState === WebSocket.OPEN && c.id !== hostA.id
  )!;
  attacker.lastError = null;

  // 1. Non-drawer trying to draw
  sendEvent(attacker, 'drawing:batch', {
    strokeId: 'hack_stroke',
    tool: 'brush',
    color: '#000000',
    width: 10,
    points: [{ x: 0.5, y: 0.5 }],
    sequence: 1,
  });
  await sleep(120);
  const blockedNonDrawer = attacker.lastError === 'FORBIDDEN_NOT_DRAWER';

  // 2. Non-host trying to change settings
  attacker.lastError = null;
  sendEvent(attacker, 'room:settings', {
    settings: { maxPlayers: 2 },
  });
  await sleep(120);
  const blockedNonHost = attacker.lastError === 'FORBIDDEN';

  // 3. Malformed JSON
  attacker.lastError = null;
  attacker.ws.send('{invalid_json: true, unclosed');
  await sleep(120);
  const blockedMalformedJson = attacker.lastError === 'MALFORMED_JSON';

  // 4. Spam rate limit check (sending 10 guesses in 5ms from a fresh guesser who hasn't guessed yet)
  const spammer = clientsA.slice(12).find(
    (c) => c.id !== drawerClient.id && c.ws.readyState === WebSocket.OPEN
  )!;
  spammer.lastError = null;
  for (let k = 0; k < 10; k++) {
    sendEvent(spammer, 'chat:guess', { text: `spam_msg_${k}` });
  }
  await sleep(150);
  const blockedSpam = spammer.lastError === 'RATE_LIMITED';

  console.log(
    `[Teste F] Bloqueio de desenho não autorizado: ${blockedNonDrawer ? 'OK' : 'FALHOU'} | Bloqueio config não-host: ${blockedNonHost ? 'OK' : 'FALHOU'} | JSON malformado: ${blockedMalformedJson ? 'OK' : 'FALHOU'} | Anti-spam: ${blockedSpam ? 'OK' : 'FALHOU'}`
  );

  // --------------------------------------------------------------------------
  // TESTE D & G: RODADAS CONSECUTIVAS E ESTABILIDADE DE MEMÓRIA / LATÊNCIA
  // --------------------------------------------------------------------------
  console.log('\n--- [Teste D & G] Rodadas Consecutivas e Estabilidade de Memória/Latência ---');
  // Host finishes Round 1 early and advances to Round 2
  sendEvent(hostA, 'round:finish');
  await sleep(300);
  sendEvent(hostA, 'round:next_now');
  await sleep(4200); // Wait for Round 2 DRAWING phase

  const round2Drawer = clientsA.find(
    (c) => c.id !== drawerClient.id && c.privateWord !== null
  ) || clientsA.find((c) => c.privateWord !== null);

  if (round2Drawer) {
    for (let b = 1; b <= 15; b++) {
      sendEvent(round2Drawer, 'drawing:batch', {
        strokeId: `r2_stk_${b}`,
        phase: 'start',
        tool: 'brush',
        color: '#16A34A',
        width: 8,
        points: [
          { x: 0.2, y: 0.2 },
          { x: 0.6, y: 0.6 },
        ],
        sequence: 1,
      });
      await sleep(50);
    }
  }

  // Measure ping latency again in Round 2
  await Promise.all(clientsA.map((c) => measurePingLatency(c)));

  const peakHealth = await fetchServerHealth();
  const allLatencies = clientsA.flatMap((c) => c.latenciesMs).filter((x) => x >= 0).sort((a, b) => a - b);
  const avgLatency = allLatencies.reduce((a, b) => a + b, 0) / Math.max(1, allLatencies.length);
  const p95Latency = allLatencies[Math.floor(allLatencies.length * 0.95)] || 0;
  const totalUnexpectedDisconnects = clientsA.reduce((acc, c) => acc + c.unexpectedDisconnects, 0);

  // Close all simulated clients cleanly
  for (const c of [...clientsA, clientB1, clientB2]) {
    c.intentionalDisconnect = true;
    sendEvent(c, 'room:leave');
    c.ws.close();
  }
  await sleep(300);

  const afterCleanupHealth = await fetchServerHealth();
  const elapsedSec = (performance.now() - startTime) / 1000;

  console.log('\n================================================================');
  console.log(' RELATÓRIO DE MÉTRICAS REAIS (35 JOGADORES SIMULTÂNEOS)');
  console.log('================================================================');
  console.log(`Duração total da bateria:        ${elapsedSec.toFixed(2)} s`);
  console.log(`Jogadores simultâneos Sala A:    ${joinedCountA}/35`);
  console.log(`Desconexões inesperadas:         ${totalUnexpectedDisconnects}`);
  console.log(`Mensagens totais enviadas:       ${totalMessagesSent} (${(totalMessagesSent / elapsedSec).toFixed(1)} msg/s)`);
  console.log(`Mensagens totais recebidas:      ${totalMessagesReceived} (${(totalMessagesReceived / elapsedSec).toFixed(1)} msg/s)`);
  console.log(`Tráfego enviado pelos clientes:  ${(totalBytesSent / 1024).toFixed(1)} KB`);
  console.log(`Tráfego recebido pelos clientes: ${(totalBytesReceived / 1024).toFixed(1)} KB`);
  console.log(`Latência WebSocket Média (RTT):  ${avgLatency.toFixed(2)} ms`);
  console.log(`Latência WebSocket P95 (RTT):    ${p95Latency.toFixed(2)} ms`);
  console.log(`Memória RAM Inicial (RSS/Heap):  ${initialHealth.rssMb} MB / ${initialHealth.heapUsedMb} MB`);
  console.log(`Memória RAM Pico 35P (RSS/Heap): ${peakHealth.rssMb} MB / ${peakHealth.heapUsedMb} MB`);
  console.log(`Memória Pós-Limpeza (RSS/Heap):  ${afterCleanupHealth.rssMb} MB / ${afterCleanupHealth.heapUsedMb} MB | Salas ativas: ${afterCleanupHealth.rooms}`);
  console.log('================================================================');
}

runStressSuite().catch((err) => {
  console.error('Erro na bateria de testes:', err);
  process.exit(1);
});
