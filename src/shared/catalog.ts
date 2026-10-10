import { ThemeEntry, WordEntry } from './types';

export const THEMES_CATALOG: ThemeEntry[] = [
  {
    id: 'oficina_senai',
    name: 'Oficina & Indústria SENAI',
    description: 'Ferramentas, máquinas industriais, mecatrônica, elétrica e equipamentos.',
    iconName: 'Wrench',
    enabled: true,
  },
  {
    id: 'tecnologia',
    name: 'Tecnologia & Informática',
    description: 'Computadores, robótica, programação, periféricos e mundo digital.',
    iconName: 'Cpu',
    enabled: true,
  },
  {
    id: 'animais',
    name: 'Animais',
    description: 'Criaturas da terra, mar e ar, de pets domésticos à fauna selvagem.',
    iconName: 'PawPrint',
    enabled: true,
  },
  {
    id: 'comidas',
    name: 'Comidas & Bebidas',
    description: 'Pratos típicos, frutas, lanches, sobremesas e delícias culinárias.',
    iconName: 'Utensils',
    enabled: true,
  },
  {
    id: 'profissoes',
    name: 'Profissões',
    description: 'Ofícios, carreiras técnicas e atividades humanas clássicas e modernas.',
    iconName: 'Briefcase',
    enabled: true,
  },
  {
    id: 'esportes',
    name: 'Esportes',
    description: 'Modalidades olímpicas, jogos de quadra, equipamentos e esportes radicais.',
    iconName: 'Trophy',
    enabled: true,
  },
  {
    id: 'objetos',
    name: 'Objetos do Cotidiano',
    description: 'Utensílios, ferramentas caseiras, acessórios e itens do dia a dia.',
    iconName: 'Lamp',
    enabled: true,
  },
  {
    id: 'natureza',
    name: 'Natureza & Clima',
    description: 'Fenômenos climáticos, plantas, relevos e elementos naturais.',
    iconName: 'Trees',
    enabled: true,
  },
  {
    id: 'transporte',
    name: 'Transportes & Veículos',
    description: 'Carros, trens, embarcações, aeronaves e meios de locomoção.',
    iconName: 'Compass',
    enabled: true,
  },
  {
    id: 'fantasia',
    name: 'Fantasia & Mitologia',
    description: 'Seres lendários, magia, criaturas místicas e mundos imaginários.',
    iconName: 'Wand2',
    enabled: true,
  },
  {
    id: 'jogos',
    name: 'Games & Passatempos',
    description: 'Videogames, jogos de tabuleiro, brinquedos e diversão.',
    iconName: 'Gamepad2',
    enabled: true,
  },
  {
    id: 'filmes_series',
    name: 'Cinema, Séries & Cultura Pop',
    description: 'Ícones do cinema, super-heróis, animação e ficção.',
    iconName: 'Film',
    enabled: true,
  },
  {
    id: 'musica',
    name: 'Música & Instrumentos',
    description: 'Instrumentos musicais de corda, sopro, percussão e palco.',
    iconName: 'Music',
    enabled: true,
  },
  {
    id: 'corpo_humano',
    name: 'Corpo Humano & Saúde',
    description: 'Órgãos, anatomia, hospital e cuidados médicos.',
    iconName: 'HeartPulse',
    enabled: true,
  },
  {
    id: 'roupas_moda',
    name: 'Roupas & Acessórios',
    description: 'Vestuário, calçados, chapéus, joias e estilo.',
    iconName: 'Shirt',
    enabled: true,
  },
  {
    id: 'escola_estudos',
    name: 'Escola & Sala de Aula',
    description: 'Materiais escolares, geometria, leitura e aprendizado.',
    iconName: 'GraduationCap',
    enabled: true,
  },
  {
    id: 'casa_moveis',
    name: 'Casa & Eletrodomésticos',
    description: 'Móveis, eletrodomésticos, cozinha e decoração.',
    iconName: 'Home',
    enabled: true,
  },
  {
    id: 'espaco_astronomia',
    name: 'Espaço & Universo',
    description: 'Planetas, foguetes, galáxias, estrelas e exploração espacial.',
    iconName: 'Rocket',
    enabled: true,
  },
  {
    id: 'brasil',
    name: 'Cultura do Brasil',
    description: 'Símbolos nacionais, comidas típicas, fauna e pontos famosos do Brasil.',
    iconName: 'Sun',
    enabled: true,
  },
  {
    id: 'festa_diversao',
    name: 'Festas & Parque de Diversões',
    description: 'Brinquedos de parque, circo, aniversário e comemorações.',
    iconName: 'PartyPopper',
    enabled: true,
  },
  {
    id: 'mar_oceano',
    name: 'Fundo do Mar & Praia',
    description: 'Vida marinha, praia, navios piratas e tesouros submersos.',
    iconName: 'Anchor',
    enabled: true,
  },
  {
    id: 'insetos_jardim',
    name: 'Insetos & Jardim',
    description: 'Pequenos insetos, flores, colmeias e vida no jardim.',
    iconName: 'Bug',
    enabled: true,
  },
  {
    id: 'construcao',
    name: 'Engenharia & Construção',
    description: 'Obras, máquinas pesadas, estruturas e ferramentas civis.',
    iconName: 'HardHat',
    enabled: true,
  },
  {
    id: 'historia_antiga',
    name: 'História & Impérios',
    description: 'Castelos, cavaleiros, pirâmides, vikings e relíquias antigas.',
    iconName: 'Crown',
    enabled: true,
  },
  {
    id: 'lugares',
    name: 'Lugares & Monumentos',
    description: 'Construções famosas, ambientes urbanos e paisagens pelo mundo.',
    iconName: 'MapPin',
    enabled: true,
  },
  {
    id: 'ciencia',
    name: 'Ciência & Laboratório',
    description: 'Química, física, experimentos, genética e invenções.',
    iconName: 'FlaskConical',
    enabled: true,
  },
  {
    id: 'misturado',
    name: 'Misturado (Todos os Temas)',
    description: 'Qualquer palavra de todos os temas do catálogo para máxima surpresa!',
    iconName: 'Shuffle',
    enabled: true,
  },
];

function createWordsForTheme(
  themeId: string,
  items: Array<{
    id: string;
    text: string;
    difficulty?: 'easy' | 'medium';
    accepted?: string[];
    hint: string;
  }>
): WordEntry[] {
  return items.map((item) => ({
    id: item.id,
    themeId,
    text: item.text,
    difficulty: item.difficulty ?? 'easy',
    acceptedAnswers: [item.text.toLowerCase(), ...(item.accepted ?? [])],
    hints: [
      item.hint,
      `Pertence à categoria ${themeId}`,
      `A palavra possui ${item.text.replace(/[\s-]/g, '').length} letras`,
    ],
    locale: 'pt-BR',
    enabled: true,
    contentRating: 'livre',
  }));
}

export const WORDS_CATALOG: WordEntry[] = [
  // 1. OFICINA & INDÚSTRIA SENAI
  ...createWordsForTheme('oficina_senai', [
    { id: 'w_engrenagem', text: 'Engrenagem', accepted: ['engrenagens', 'roda dentada'], hint: 'Peça mecânica circular com dentes que transmite movimento' },
    { id: 'w_chave_inglesa', text: 'Chave Inglesa', accepted: ['chave de boca', 'chave grifo'], hint: 'Ferramenta metálica ajustável usada para apertar porcas e parafusos' },
    { id: 'w_paquimetro', text: 'Paquímetro', difficulty: 'medium', accepted: ['paquimetro'], hint: 'Instrumento de precisão usado na mecânica para medir milímetros' },
    { id: 'w_empilhadeira', text: 'Empilhadeira', accepted: ['empilhador'], hint: 'Veículo industrial com garfos na frente para levantar paletes pesados' },
    { id: 'w_furadeira', text: 'Furadeira', accepted: ['parafusadeira'], hint: 'Ferramenta elétrica portátil com broca giratória' },
    { id: 'w_soldador', text: 'Máquina de Solda', accepted: ['solda', 'soldador', 'mascara de solda'], hint: 'Equipamento que une metais usando calor intenso e faíscas' },
    { id: 'w_multimetro', text: 'Multímetro', difficulty: 'medium', accepted: ['multimetro', 'voltimetro'], hint: 'Aparelho com pontas de prova usado por eletricistas para medir tensão' },
    { id: 'w_torno', text: 'Torno Mecânico', difficulty: 'medium', accepted: ['torno', 'torno mecanico'], hint: 'Máquina de oficina que gira peças metálicas para usinagem' },
    { id: 'w_capacete_epi', text: 'Capacete de Segurança', accepted: ['capacete', 'epi', 'capacete epi'], hint: 'Equipamento de proteção individual usado na cabeça em fábricas e obras' },
    { id: 'w_extintor', text: 'Extintor', accepted: ['extintor de incendio'], hint: 'Cilindro vermelho pressurizado para apagar incêndios' },
    { id: 'w_braco_robotico', text: 'Braço Robótico', accepted: ['braco robotico', 'robo industrial'], hint: 'Máquina articulada automatizada típica de linhas de montagem' },
    { id: 'w_alicate', text: 'Alicate', accepted: ['alicate de corte'], hint: 'Ferramenta manual articulada usada para segurar ou cortar fios' },
  ]),

  // 2. TECNOLOGIA & INFORMÁTICA
  ...createWordsForTheme('tecnologia', [
    { id: 'w_impressora3d', text: 'Impressora 3D', accepted: ['impressora 3d', 'impressao 3d'], hint: 'Máquina que cria objetos tridimensionais camada por camada com filamento' },
    { id: 'w_robo', text: 'Robô', accepted: ['robo', 'androide'], hint: 'Máquina programável com aparência ou funções automáticas' },
    { id: 'w_drone', text: 'Drone', accepted: ['quadricoptero'], hint: 'Pequeno veículo aéreo controlado remotamente com quatro hélices' },
    { id: 'w_notebook', text: 'Notebook', accepted: ['laptop', 'computador portatil', 'computador'], hint: 'Computador portátil que abre e fecha com tela e teclado integrados' },
    { id: 'w_mouse', text: 'Mouse', accepted: ['rato de computador'], hint: 'Periférico de mão usado para mover o cursor na tela do PC' },
    { id: 'w_teclado', text: 'Teclado', accepted: ['teclado mecanico'], hint: 'Periférico cheio de teclas com letras e números para digitar' },
    { id: 'w_roteador', text: 'Roteador Wi-Fi', accepted: ['roteador', 'wifi', 'modem'], hint: 'Aparelho com antenas que distribui internet sem fio pela casa' },
    { id: 'w_pendrive', text: 'Pendrive', accepted: ['pen drive', 'memoria usb'], hint: 'Pequeno dispositivo USB de bolso para guardar arquivos' },
    { id: 'w_oculos_vr', text: 'Óculos VR', accepted: ['oculos vr', 'realidade virtual'], hint: 'Visor colocado no rosto para imersão em realidade virtual 3D' },
    { id: 'w_smartphone', text: 'Smartphone', accepted: ['celular', 'telefone celular'], hint: 'Aparelho de bolso com tela sensível ao toque e câmeras' },
    { id: 'w_bateria_pilha', text: 'Bateria', accepted: ['pilha', 'carregador'], hint: 'Componente que armazena carga elétrica com polos positivo e negativo' },
  ]),

  // 3. ANIMAIS
  ...createWordsForTheme('animais', [
    { id: 'w_girafa', text: 'Girafa', accepted: ['girafas'], hint: 'Mamífero africano com o pescoço mais longo do reino animal' },
    { id: 'w_polvo', text: 'Polvo', accepted: ['octopus'], hint: 'Animal marinho inteligente com oito tentáculos e ventosas' },
    { id: 'w_camaleao', text: 'Camaleão', difficulty: 'medium', accepted: ['camaleao'], hint: 'Réptil famoso por mudar de cor para se camuflar' },
    { id: 'w_pinguim', text: 'Pinguim', accepted: ['pinguins'], hint: 'Ave que não voa, vive no gelo e parece usar smoking' },
    { id: 'w_ornitorrinco', text: 'Ornitorrinco', difficulty: 'medium', hint: 'Mamífero australiano com bico de pato e cauda de castor' },
    { id: 'w_coruja', text: 'Coruja', accepted: ['mocho'], hint: 'Ave noturna de olhos grandes que gira a cabeça quase toda' },
    { id: 'w_elefante', text: 'Elefante', hint: 'Maior mamífero terrestre, possui grandes orelhas e uma longa tromba' },
    { id: 'w_canguru', text: 'Canguru', hint: 'Animal australiano que salta e carrega o filhote numa bolsa' },
    { id: 'w_flamengo_ave', text: 'Flamingo', hint: 'Ave de penas cor-de-rosa que costuma ficar apoiada em uma perna só' },
    { id: 'w_preguica', text: 'Bicho-Preguiça', accepted: ['preguica', 'bicho preguica'], hint: 'Mamífero muito lento que vive pendurado nos galhos das árvores' },
  ]),

  // 4. COMIDAS & BEBIDAS
  ...createWordsForTheme('comidas', [
    { id: 'w_pipoca', text: 'Pipoca', accepted: ['balde de pipoca'], hint: 'Milho estourado indispensável na sessão de cinema' },
    { id: 'w_brigadeiro', text: 'Brigadeiro', hint: 'Doce brasileiro de chocolate enrolado com granulado' },
    { id: 'w_abacaxi', text: 'Abacaxi', accepted: ['ananas'], hint: 'Fruta tropical espinhosa com uma coroa verde no topo' },
    { id: 'w_sushi', text: 'Sushi', accepted: ['sashimi', 'comida japonesa'], hint: 'Rolinho japonês de arroz com alga nori e salmão' },
    { id: 'w_lasanha', text: 'Lasanha', difficulty: 'medium', hint: 'Prato italiano assado em camadas de massa, molho e queijo' },
    { id: 'w_croissant', text: 'Croissant', difficulty: 'medium', accepted: ['pao meia lua'], hint: 'Pão folhado francês em formato de meia-lua' },
    { id: 'w_hamburguer', text: 'Hambúrguer', accepted: ['hamburguer', 'xis', 'cheeseburger'], hint: 'Sanduíche com pão com gergelim, carne, queijo e alface' },
    { id: 'w_pizza', text: 'Pizza', hint: 'Massa redonda fatiada em triângulos com queijo derretido' },
    { id: 'w_sorvete', text: 'Sorvete', accepted: ['casquinha', 'picole'], hint: 'Sobremesa gelada servida em bolas na casquinha de biscoito' },
    { id: 'w_coxinha', text: 'Coxinha', hint: 'Salgado brasileiro frito em formato de gota recheado com frango' },
  ]),

  // 5. PROFISSÕES
  ...createWordsForTheme('profissoes', [
    { id: 'w_astronauta', text: 'Astronauta', accepted: ['cosmonauta'], hint: 'Viaja em foguetes usando traje espacial e capacete com viseira' },
    { id: 'w_bombeiro', text: 'Bombeiro', accepted: ['bombeira'], hint: 'Combate incêndios com mangueira e caminhão vermelho' },
    { id: 'w_maestro', text: 'Maestro', difficulty: 'medium', accepted: ['regente'], hint: 'Rege uma orquestra usando uma batuta' },
    { id: 'w_arqueologo', text: 'Arqueólogo', difficulty: 'medium', accepted: ['arqueologo'], hint: 'Escava ruínas antigas procurando fósseis e relíquias' },
    { id: 'w_detetive', text: 'Detetive', accepted: ['investigador'], hint: 'Investiga pistas e pegadas usando uma lupa' },
    { id: 'w_cozinheiro', text: 'Chef de Cozinha', accepted: ['cozinheiro', 'chef', 'mestre cuca'], hint: 'Prepara pratos usando chapéu branco alto e colher de pau' },
    { id: 'w_pintor', text: 'Pintor', accepted: ['artista'], hint: 'Trabalha com pincel, paleta de tintas e tela no cavalete' },
    { id: 'w_fotografo', text: 'Fotógrafo', accepted: ['fotografo'], hint: 'Profissional que registra momentos com câmera e lente' },
  ]),

  // 6. ESPORTES
  ...createWordsForTheme('esportes', [
    { id: 'w_arquearia', text: 'Tiro com Arco', accepted: ['arco e flecha', 'arquearia'], hint: 'Esporte de mira com arco, flecha e alvo circular colorido' },
    { id: 'w_surfe', text: 'Surfe', accepted: ['surf', 'surfista'], hint: 'Deslizar sobre as ondas do mar em cima de uma prancha' },
    { id: 'w_esgrima', text: 'Esgrima', difficulty: 'medium', hint: 'Duelo olímpico com roupa branca, máscara e espada florete' },
    { id: 'w_basquete', text: 'Basquete', accepted: ['basquetebol'], hint: 'Arremessar a bola laranja na cesta com aro e rede' },
    { id: 'w_paraquedismo', text: 'Paraquedismo', difficulty: 'medium', accepted: ['paraquedas'], hint: 'Saltar de um avião e abrir um grande tecido no ar' },
    { id: 'w_boliche', text: 'Boliche', hint: 'Lançar uma bola pesada na pista para derrubar dez pinos brancos' },
    { id: 'w_skate', text: 'Skate', accepted: ['skatista'], hint: 'Prancha de madeira com quatro rodinhas para manobras' },
    { id: 'w_tenis_mesa', text: 'Tênis de Mesa', accepted: ['ping pong', 'pingue pongue', 'tenis de mesa'], hint: 'Esporte com raquetes pequenas e bolinha leve sobre mesa com rede' },
  ]),

  // 7. OBJETOS DO COTIDIANO
  ...createWordsForTheme('objetos', [
    { id: 'w_guardachuva', text: 'Guarda-chuva', accepted: ['guarda chuva', 'sombrinha'], hint: 'Abre-se sobre a cabeça para proteger das gotas de chuva' },
    { id: 'w_ampulheta', text: 'Ampulheta', difficulty: 'medium', accepted: ['relogio de areia'], hint: 'Dois bulbos de vidro que marcam o tempo com areia caindo' },
    { id: 'w_cadeado', text: 'Cadeado', accepted: ['tranca'], hint: 'Trava metálica que precisa de chave ou segredo para abrir' },
    { id: 'w_bussola', text: 'Bússola', difficulty: 'medium', accepted: ['bussola'], hint: 'Mostrador com agulha magnética que aponta sempre para o Norte' },
    { id: 'w_ventilador', text: 'Ventilador', hint: 'Aparelho com hélices giratórias dentro de uma grade para fazer vento' },
    { id: 'w_tesoura', text: 'Tesoura', hint: 'Objeto com duas lâminas e argolas para os dedos usado para cortar papel' },
    { id: 'w_chave', text: 'Chave', hint: 'Pequeno objeto metálico dentado usado para destrancar portas' },
    { id: 'w_lanterna', text: 'Lanterna', hint: 'Tubo portátil com pilha que emite um feixe de luz no escuro' },
  ]),

  // 8. NATUREZA & CLIMA
  ...createWordsForTheme('natureza', [
    { id: 'w_vulcao', text: 'Vulcão', accepted: ['vulcao'], hint: 'Montanha com cratera que cospe fumaça e lava quente' },
    { id: 'w_arcoiris', text: 'Arco-íris', accepted: ['arco iris'], hint: 'Arco de sete cores que surge no céu quando há sol e chuva' },
    { id: 'w_cacto', text: 'Cacto', accepted: ['cactus'], hint: 'Planta verde cheia de espinhos típica do deserto' },
    { id: 'w_tornado', text: 'Tornado', difficulty: 'medium', accepted: ['furacao', 'redemoinho'], hint: 'Funil gigante de vento giratório que toca o chão' },
    { id: 'w_cachoeira', text: 'Cachoeira', accepted: ['cascata'], hint: 'Queda de água natural de um rio sobre um paredão de pedras' },
    { id: 'w_relampago', text: 'Relâmpago', accepted: ['relampago', 'raio', 'trovao'], hint: 'Clarão elétrico em zigue-zague que corta o céu na tempestade' },
    { id: 'w_iceberg', text: 'Iceberg', hint: 'Bloco gigante de gelo flutuando no oceano gelado' },
  ]),

  // 9. TRANSPORTES & VEÍCULOS
  ...createWordsForTheme('transporte', [
    { id: 'w_submarino', text: 'Submarino', hint: 'Embarcação que navega debaixo da água e usa periscópio' },
    { id: 'w_balaodear', text: 'Balão de Ar Quente', accepted: ['balao', 'balao de ar quente'], hint: 'Voa pelo céu aquecido por fogo levando passageiros num cesto' },
    { id: 'w_helicoptero', text: 'Helicóptero', accepted: ['helicoptero'], hint: 'Aeronave que decola na vertical com grandes hélices no topo' },
    { id: 'w_teleferico', text: 'Teleférico', difficulty: 'medium', accepted: ['teleferico', 'bondinho'], hint: 'Cabine suspensa em cabos de aço que sobe montanhas' },
    { id: 'w_trem', text: 'Locomotiva', accepted: ['trem', 'trem de ferro'], hint: 'Puxa vagões sobre trilhos de ferro soltando fumaça pela chaminé' },
    { id: 'w_bicicleta', text: 'Bicicleta', accepted: ['bike'], hint: 'Veículo de duas rodas movido a pedaladas e guidão' },
    { id: 'w_ambulancia', text: 'Ambulância', accepted: ['ambulancia'], hint: 'Furgão branco de resgate médico com sirene vermelha no teto' },
  ]),

  // 10. FANTASIA & MITOLOGIA
  ...createWordsForTheme('fantasia', [
    { id: 'w_dragao', text: 'Dragão', accepted: ['dragao'], hint: 'Criatura alada com escamas que cospe fogo e guarda tesouros' },
    { id: 'w_sereia', text: 'Sereia', hint: 'Ser mitológico marinho metade mulher e metade cauda de peixe' },
    { id: 'w_discovoador', text: 'Disco Voador', accepted: ['ovni', 'nave espacial'], hint: 'Nave alienígena redonda com cúpula e feixe de luz abduzindo' },
    { id: 'w_unicornio', text: 'Unicórnio', accepted: ['unicornio'], hint: 'Cavalo mágico branco com um chifre espiralado na testa' },
    { id: 'w_fenix', text: 'Fênix', difficulty: 'medium', accepted: ['fenix', 'passaro de fogo'], hint: 'Pássaro lendário de fogo que renasce das próprias cinzas' },
    { id: 'w_genio', text: 'Gênio da Lâmpada', accepted: ['genio', 'lampada magica'], hint: 'Ser mágico azul que sai de uma lâmpada dourada para realizar três desejos' },
    { id: 'w_lobisomem', text: 'Lobisomem', hint: 'Criatura que se transforma em lobo nas noites de lua cheia' },
  ]),

  // 11. GAMES & PASSATEMPOS
  ...createWordsForTheme('jogos', [
    { id: 'w_xadrez', text: 'Xadrez', accepted: ['tabuleiro de xadrez'], hint: 'Jogo de tabuleiro quadriculado com Rei, Rainha, Cavalo e Torre' },
    { id: 'w_joystick', text: 'Controle de Videogame', accepted: ['controle', 'joystick', 'gamepad', 'manete'], hint: 'Acessório com botões e analógicos usado para jogar videogame' },
    { id: 'w_cubo_magico', text: 'Cubo Mágico', accepted: ['cubo magico', 'rubik'], hint: 'Quebra-cabeça tridimensional com faces coloridas que giram' },
    { id: 'w_pipa', text: 'Pipa', accepted: ['papagaio', 'arraia', 'pandorga'], hint: 'Brinquedo de papel colorido que voa alto preso a uma linha com rabiola' },
    { id: 'w_domino', text: 'Dominó', accepted: ['domino'], hint: 'Jogo de peças retangulares com bolinhas numeradas de zero a seis' },
    { id: 'w_fliperama', text: 'Fliperama', accepted: ['arcade', 'maquina de arcade'], hint: 'Gabinete clássico de jogos eletrônicos com tela, alavanca e fichas' },
  ]),

  // 12. CINEMA, SÉRIES & CULTURA POP
  ...createWordsForTheme('filmes_series', [
    { id: 'w_sabre_luz', text: 'Sabre de Luz', accepted: ['espada laser', 'lightsaber'], hint: 'Espada brilhante de energia usada pelos cavaleiros Jedi no espaço' },
    { id: 'w_titanic', text: 'Titanic', hint: 'Navio transatlântico famoso do cinema que colidiu com um iceberg' },
    { id: 'w_claquete', text: 'Claquete', hint: 'Placa preta e branca batida pelos diretores no início de uma cena de filme' },
    { id: 'w_oscar', text: 'Troféu do Oscar', accepted: ['oscar', 'estatueta do oscar'], hint: 'Estatueta dourada famosa entregue aos melhores filmes de Hollywood' },
    { id: 'w_tapete_magico', text: 'Tapete Mágico', accepted: ['tapete magico', 'tapete voador'], hint: 'Tapete persa encantado que voa pelos céus das Arábias' },
    { id: 'w_dinossauro', text: 'Tiranossauro Rex', accepted: ['dinossauro', 't-rex', 'tiranossauro'], hint: 'Dinossauro gigante carnívoro de braços curtos famoso nos cinemas' },
  ]),

  // 13. MÚSICA & INSTRUMENTOS
  ...createWordsForTheme('musica', [
    { id: 'w_violao', text: 'Violão', accepted: ['violao'], hint: 'Instrumento acústico de madeira com seis cordas' },
    { id: 'w_bateria', text: 'Bateria Musical', accepted: ['bateria'], hint: 'Conjunto de tambores e pratos tocado com duas baquetas' },
    { id: 'w_piano', text: 'Piano de Cauda', accepted: ['piano', 'teclado musical'], hint: 'Instrumento clássico com dezenas de teclas brancas e pretas' },
    { id: 'w_saxofone', text: 'Saxofone', accepted: ['sax'], hint: 'Instrumento de sopro dourado e curvado muito usado no jazz' },
    { id: 'w_sanfona', text: 'Sanfona', accepted: ['acordeao', 'acordeão', 'gaita'], hint: 'Instrumento com fole no meio que abre e fecha tocando forró' },
    { id: 'w_microfone', text: 'Microfone', hint: 'Aparelho segurado pelo cantor no palco para amplificar a voz' },
    { id: 'w_fone_ouvido', text: 'Fone de Ouvido', accepted: ['headphone', 'headset'], hint: 'Arco colocado na cabeça sobre as orelhas para escutar música' },
  ]),

  // 14. CORPO HUMANO & SAÚDE
  ...createWordsForTheme('corpo_humano', [
    { id: 'w_coracao', text: 'Coração', accepted: ['coracao'], hint: 'Órgão que bate no peito e bombeia sangue pelo corpo' },
    { id: 'w_cerebro', text: 'Cérebro', accepted: ['cerebro'], hint: 'Órgão dentro do crânio responsável pelos pensamentos e memória' },
    { id: 'w_esqueleto', text: 'Esqueleto', accepted: ['caveira', 'ossos'], hint: 'Conjunto de ossos e costelas que sustenta o corpo humano' },
    { id: 'w_estetoscopio', text: 'Estetoscópio', difficulty: 'medium', accepted: ['estetoscopio'], hint: 'Instrumento que o médico coloca no ouvido para escutar o peito' },
    { id: 'w_dente', text: 'Dente Molar', accepted: ['dente', 'dentes'], hint: 'Estrutura branca da boca cuidada pelo dentista com escova e pasta' },
    { id: 'w_termometro', text: 'Termômetro', accepted: ['termometro'], hint: 'Instrumento colocado debaixo do braço para medir febre' },
  ]),

  // 15. ROUPAS & ACESSÓRIOS
  ...createWordsForTheme('roupas_moda', [
    { id: 'w_oculos_sol', text: 'Óculos de Sol', accepted: ['oculos de sol', 'oculos escuros', 'oculos'], hint: 'Acessório com lentes escuras usado no rosto em dias ensolarados' },
    { id: 'w_gravata', text: 'Gravata', accepted: ['gravata borboleta'], hint: 'Tira de tecido usada no colarinho da camisa social com terno' },
    { id: 'w_chapeu_cowboy', text: 'Chapéu de Cowboy', accepted: ['chapeu de cowboy', 'chapeu'], hint: 'Chapéu de abas largas típico do velho oeste' },
    { id: 'w_cachecol', text: 'Cachecol', hint: 'Faixa de lã enrolada no pescoço durante o inverno frio' },
    { id: 'w_coroa', text: 'Coroa Real', accepted: ['coroa'], hint: 'Adorno de ouro com pedras preciosas usado na cabeça por reis e rainhas' },
    { id: 'w_relogio_pulso', text: 'Relógio de Pulso', accepted: ['relogio', 'relogio de pulso', 'smartwatch'], hint: 'Acessório com pulseira e ponteiros usado no braço para ver as horas' },
  ]),

  // 16. ESCOLA & SALA DE AULA
  ...createWordsForTheme('escola_estudos', [
    { id: 'w_mochila', text: 'Mochila Escolar', accepted: ['mochila'], hint: 'Bolsa com duas alças carregada nas costas cheia de cadernos' },
    { id: 'w_globo_terrestre', text: 'Globo Terrestre', accepted: ['globo', 'mapa mundi'], hint: 'Esfera giratória com o mapa de todos os continentes e oceanos' },
    { id: 'w_quadro_negro', text: 'Quadro-Negro', accepted: ['quadro negro', 'lousa'], hint: 'Painel na parede da sala de aula onde o professor escreve com giz' },
    { id: 'w_calculadora', text: 'Calculadora', hint: 'Aparelho cheio de botões numéricos usado para fazer contas rápidas' },
    { id: 'w_compasso', text: 'Compasso Geométrico', difficulty: 'medium', accepted: ['compasso'], hint: 'Instrumento escolar de duas hastes usado para desenhar círculos perfeitos' },
    { id: 'w_apontador', text: 'Apontador', hint: 'Pequeno objeto com lâmina usado para afiar a ponta do lápis' },
  ]),

  // 17. CASA & ELETRODOMÉSTICOS
  ...createWordsForTheme('casa_moveis', [
    { id: 'w_geladeira', text: 'Geladeira', accepted: ['refrigerador'], hint: 'Eletrodoméstico alto da cozinha que conserva alimentos gelados' },
    { id: 'w_maquina_lavar', text: 'Máquina de Lavar', accepted: ['maquina de lavar', 'lavadora'], hint: 'Eletrodoméstico com porta redonda de vidro que lava roupas com espuma' },
    { id: 'w_abajur', text: 'Abajur', accepted: ['luminaria'], hint: 'Luminária de cabeceira com cúpula sobre a mesa do quarto' },
    { id: 'w_torradeira', text: 'Torradeira', hint: 'Aparelho elétrico onde as fatias de pão pulam quentes para cima' },
    { id: 'w_chuveiro', text: 'Chuveiro', accepted: ['ducha'], hint: 'Instalado no alto do banheiro, solta água para o banho' },
    { id: 'w_sofa', text: 'Sofá', accepted: ['sofa', 'poltrona'], hint: 'Móvel estofado com almofadas na sala para sentar e assistir TV' },
  ]),

  // 18. ESPAÇO & UNIVERSO
  ...createWordsForTheme('espaco_astronomia', [
    { id: 'w_foguete', text: 'Foguete Espacial', accepted: ['foguete', 'onibus espacial'], hint: 'Veículo alto que decola com labaredas de fogo rumo ao espaço' },
    { id: 'w_saturno', text: 'Saturno', hint: 'Planeta gigante famoso pelos seus grandes anéis ao redor' },
    { id: 'w_estacao_espacial', text: 'Estação Espacial', difficulty: 'medium', accepted: ['estacao espacial', 'satelite'], hint: 'Estrutura em órbita da Terra com grandes painéis solares' },
    { id: 'w_cometa', text: 'Cometa', accepted: ['estrela cadente', 'meteoro'], hint: 'Corpo celeste que cruza o espaço deixando uma longa cauda luminosa' },
    { id: 'w_eclipse', text: 'Eclipse Solar', accepted: ['eclipse'], hint: 'Fenômeno em que a Lua passa na frente do Sol escurecendo o dia' },
  ]),

  // 19. CULTURA DO BRASIL
  ...createWordsForTheme('brasil', [
    { id: 'w_cristo_redentor', text: 'Cristo Redentor', accepted: ['cristo', 'corcovado'], hint: 'Estátua gigante de braços abertos no topo do morro no Rio de Janeiro' },
    { id: 'w_capivara', text: 'Capivara', hint: 'Maior roedor do mundo, muito simpático e comum perto de lagoas no Brasil' },
    { id: 'w_tucano', text: 'Tucano', hint: 'Ave tropical brasileira famosa pelo grande bico colorido laranja' },
    { id: 'w_pao_de_queijo', text: 'Pão de Queijo', accepted: ['pao de queijo'], hint: 'Bolinha assada mineira deliciosa feita com polvilho e queijo' },
    { id: 'w_rede_descanso', text: 'Rede de Descanso', accepted: ['rede', 'rede de dormir'], hint: 'Tecido suspenso entre dois ganchos na varanda para balançar e cochilar' },
    { id: 'w_chimarrao', text: 'Chimarrão', accepted: ['chimarrao', 'cuia', 'terere'], hint: 'Bebida tradicional do sul servida quente numa cuia com bomba metálica' },
  ]),

  // 20. FESTAS & PARQUE DE DIVERSÕES
  ...createWordsForTheme('festa_diversao', [
    { id: 'w_roda_gigante', text: 'Roda-Gigante', accepted: ['roda gigante'], hint: 'Atração circular altíssima com cabines que giram devagar no parque' },
    { id: 'w_montanha_russa', text: 'Montanha-Russa', accepted: ['montanha russa'], hint: 'Trilhos altos com loopings e carrinhos em alta velocidade no parque' },
    { id: 'w_bolo_aniversario', text: 'Bolo de Aniversário', accepted: ['bolo', 'bolo de aniversario'], hint: 'Doce confeitado com velinhas acesas no topo para cantar parabéns' },
    { id: 'w_algodao_doce', text: 'Algodão-Doce', accepted: ['algodao doce'], hint: 'Nuvem macia de açúcar colorido enrolada num palito' },
    { id: 'w_carrossel', text: 'Carrossel', hint: 'Brinquedo giratório de parque com cavalinhos coloridos que sobem e descem' },
  ]),

  // 21. FUNDO DO MAR & PRAIA
  ...createWordsForTheme('mar_oceano', [
    { id: 'w_tubarao', text: 'Tubarão', accepted: ['tubarao'], hint: 'Predador dos oceanos com barbatana triangular fora da água e dentes afiados' },
    { id: 'w_agua_viva', text: 'Água-Viva', accepted: ['agua viva', 'medusa'], hint: 'Animal marinho transparente em forma de guarda-chuva com tentáculos' },
    { id: 'w_cavalo_marinho', text: 'Cavalo-Marinho', accepted: ['cavalo marinho'], hint: 'Pequeno peixe de nado vertical com cabeça parecida com a de um cavalo' },
    { id: 'w_bau_tesouro', text: 'Baú do Tesouro', accepted: ['bau', 'tesouro', 'bau de pirata'], hint: 'Caixa de madeira trancada no fundo do mar cheia de moedas de ouro' },
    { id: 'w_ancora', text: 'Âncora', accepted: ['ancora'], hint: 'Peça pesada de ferro com ganchos lançada ao mar para segurar o navio' },
  ]),

  // 22. INSETOS & JARDIM
  ...createWordsForTheme('insetos_jardim', [
    { id: 'w_borboleta', text: 'Borboleta', hint: 'Inseto com grandes asas coloridas e simétricas que antes era lagarta' },
    { id: 'w_abelha', text: 'Abelha', hint: 'Inseto listrado de amarelo e preto que produz mel na colmeia' },
    { id: 'w_joaninha', text: 'Joaninha', hint: 'Pequeno besouro arredondado vermelho com pintinhas pretas' },
    { id: 'w_caracol', text: 'Caracol', accepted: ['caramujo'], hint: 'Anda bem devagar pelo jardim carregando uma concha espiral nas costas' },
    { id: 'w_girassol', text: 'Girassol', hint: 'Flor alta de pétalas amarelas que acompanha a posição do sol' },
  ]),

  // 23. ENGENHARIA & CONSTRUÇÃO
  ...createWordsForTheme('construcao', [
    { id: 'w_guindaste', text: 'Guindaste', accepted: ['grua'], hint: 'Torre metálica muito alta usada em obras para içar cargas pesadas' },
    { id: 'w_escavadeira', text: 'Escavadeira', accepted: ['trator', 'retroescavadeira'], hint: 'Máquina amarela pesada com braço hidráulico e concha para cavar terra' },
    { id: 'w_carrinho_mao', text: 'Carrinho de Mão', accepted: ['carrinho de mao', 'carriola'], hint: 'Caçamba com uma roda na frente e duas alças para transportar cimento' },
    { id: 'w_ponte_estaiada', text: 'Ponte', accepted: ['ponte estaiada', 'viaduto'], hint: 'Estrutura suspensa por cabos e pilares para atravessar carros sobre um rio' },
    { id: 'w_trena', text: 'Trena', hint: 'Fita métrica enrolada dentro de um estojo usada para medir paredes' },
  ]),

  // 24. HISTÓRIA & IMPÉRIOS
  ...createWordsForTheme('historia_antiga', [
    { id: 'w_cavalo_troia', text: 'Cavalo de Troia', difficulty: 'medium', accepted: ['cavalo de madeira'], hint: 'Cavalo gigante de madeira usado pelos gregos para entrar na muralha' },
    { id: 'w_catapulta', text: 'Catapulta', hint: 'Máquina de guerra medieval de madeira usada para lançar pedras em castelos' },
    { id: 'w_armadura', text: 'Armadura Medieval', accepted: ['armadura', 'cavaleiro'], hint: 'Traje completo de placas de aço com elmo usado por cavaleiros' },
    { id: 'w_caravela', text: 'Caravela', accepted: ['navio antigo', 'barco a vela'], hint: 'Antigo navio de madeira com grandes velas brancas das grandes navegações' },
    { id: 'w_viking', text: 'Capacete Viking', accepted: ['viking', 'guerreiro viking'], hint: 'Guerreiro nórdico dos mares retratado com elmo e barco drakar' },
  ]),

  // 25. LUGARES & MONUMENTOS
  ...createWordsForTheme('lugares', [
    { id: 'w_farol', text: 'Farol', accepted: ['farol maritimo'], hint: 'Torre alta na costa que gira uma luz forte para guiar navios à noite' },
    { id: 'w_piramide', text: 'Pirâmide', accepted: ['piramide', 'piramides do egito'], hint: 'Monumento triangular gigante de pedra no deserto do Egito' },
    { id: 'w_iglu', text: 'Iglu', accepted: ['casa de gelo'], hint: 'Casa redonda em forma de cúpula feita com blocos de neve' },
    { id: 'w_castelo', text: 'Castelo', accepted: ['fortaleza'], hint: 'Construção medieval com muralhas, ponte levadiça e torres altas' },
    { id: 'w_torre_eiffel', text: 'Torre Eiffel', accepted: ['torre de paris'], hint: 'Famosa torre metálica pontiaguda localizada em Paris' },
  ]),

  // 26. CIÊNCIA & LABORATÓRIO
  ...createWordsForTheme('ciencia', [
    { id: 'w_microscopio', text: 'Microscópio', difficulty: 'medium', accepted: ['microscopio'], hint: 'Aparelho óptico de laboratório que amplia células e bactérias' },
    { id: 'w_telescopio', text: 'Telescópio', accepted: ['telescopio', 'luneta'], hint: 'Tubo com lentes apontado para o céu para ver estrelas e planetas' },
    { id: 'w_dna', text: 'DNA', difficulty: 'medium', accepted: ['helice dupla', 'genetica'], hint: 'Molécula genética desenhada como uma escada torcida em dupla hélice' },
    { id: 'w_ima', text: 'Ímã', accepted: ['ima', 'iman', 'magneto'], hint: 'Objeto em formato de ferradura vermelha e azul que atrai metais' },
    { id: 'w_atomo', text: 'Átomo', accepted: ['atomo'], hint: 'Núcleo central cercado por anéis elípticos com elétrons girando' },
  ]),
];

export const DRAWING_PALETTE = [
  { hex: '#0F172A', name: 'Preto Grafite' },
  { hex: '#64748B', name: 'Cinza Ardósia' },
  { hex: '#DC2626', name: 'Vermelho Vivo' },
  { hex: '#EA580C', name: 'Laranja Quente' },
  { hex: '#D97706', name: 'Âmbar Ouro' },
  { hex: '#16A34A', name: 'Verde Folha' },
  { hex: '#0D9488', name: 'Turquesa' },
  { hex: '#2563EB', name: 'Azul Cobalto' },
  { hex: '#7C3AED', name: 'Violeta Real' },
  { hex: '#DB2777', name: 'Rosa Magenta' },
  { hex: '#78350F', name: 'Marrom Terra' },
  { hex: '#FACC15', name: 'Amarelo Sol' },
];

export const BRUSH_WIDTHS = [
  { id: 'thin', label: 'Fino', size: 4 },
  { id: 'medium', label: 'Médio', size: 9 },
  { id: 'thick', label: 'Grosso', size: 18 },
  { id: 'xl', label: 'Extra', size: 30 },
];
