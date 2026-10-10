import { ThemeEntry, WordEntry } from './types';

export const THEMES_CATALOG: ThemeEntry[] = [
  // 1-10: SENAI, Indústria, Engenharia & Tecnologia
  { id: 'oficina_senai', name: 'Oficina & Indústria SENAI', description: 'Ferramentas, máquinas industriais, usinagem e equipamentos técnicos.', iconName: 'Wrench', enabled: true },
  { id: 'eletrica_energia', name: 'Elétrica & Energia', description: 'Circuitos, lâmpadas, transformadores, tomadas e geração de energia.', iconName: 'Zap', enabled: true },
  { id: 'automacao_robotica', name: 'Robótica & Automação', description: 'Robôs industriais, sensores, drones, engrenagens e mecatrônica.', iconName: 'Bot', enabled: true },
  { id: 'mecanica_autos', name: 'Mecânica Automotiva', description: 'Motores, pneus, peças de carro, oficina mecânica e manutenção.', iconName: 'Car', enabled: true },
  { id: 'seguranca_epi', name: 'Segurança do Trabalho (EPI)', description: 'Capacetes, luvas, extintores, placas e proteção industrial.', iconName: 'HardHat', enabled: true },
  { id: 'solda_metalurgia', name: 'Soldagem & Metalurgia', description: 'Tochas de solda, bigorna, forja, aço, correntes e corte térmico.', iconName: 'Flame', enabled: true },
  { id: 'marcenaria_madeira', name: 'Marcenaria & Carpintaria', description: 'Serrotes, madeira, martelos, pregos, lixas e móveis artesanais.', iconName: 'Hammer', enabled: true },
  { id: 'construcao', name: 'Engenharia & Construção Civil', description: 'Guindastes, tratores, tijolos, pontes, obras e ferramentas civis.', iconName: 'Factory', enabled: true },
  { id: 'tecnologia', name: 'Tecnologia & Informática', description: 'Computadores, periféricos, hardware, redes e dispositivos modernos.', iconName: 'Cpu', enabled: true },
  { id: 'internet_redes', name: 'Internet & Mundo Digital', description: 'Wi-Fi, nuvem, e-mail, bateria, celular e ícones da era conectada.', iconName: 'Smartphone', enabled: true },

  // 11-20: Natureza, Animais & Meio Ambiente
  { id: 'animais', name: 'Animais Selvagens', description: 'Grandes feras da savana, selva e criaturas exóticas da natureza.', iconName: 'PawPrint', enabled: true },
  { id: 'pets_fazenda', name: 'Pets & Fazendinha', description: 'Cães, gatos, cavalos, vacas e animais domésticos do campo.', iconName: 'PawPrint', enabled: true },
  { id: 'aves_passaros', name: 'Aves & Pássaros', description: 'Águias, tucanos, corujas, pinguins, pavões e aves do céu.', iconName: 'Bird', enabled: true },
  { id: 'mar_oceano', name: 'Fundo do Mar & Oceano', description: 'Tubarões, polvos, baleias, corais e mistérios submersos.', iconName: 'Anchor', enabled: true },
  { id: 'insetos_jardim', name: 'Insetos & Vida no Jardim', description: 'Borboletas, abelhas, formigas, flores e pequenos habitantes.', iconName: 'Bug', enabled: true },
  { id: 'repteis_anfibios', name: 'Répteis & Anfíbios', description: 'Jacarés, tartarugas, sapos, cobras, camaleões e iguanas.', iconName: 'Fish', enabled: true },
  { id: 'dinossauros_prehistoria', name: 'Dinossauros & Pré-História', description: 'T-Rex, tricerátops, fósseis, mamutes e homens das cavernas.', iconName: 'Skull', enabled: true },
  { id: 'natureza', name: 'Clima & Fenômenos Naturais', description: 'Vulcões, tornados, arco-íris, tempestades, neve e relâmpagos.', iconName: 'Trees', enabled: true },
  { id: 'plantas_botanica', name: 'Árvores, Flores & Botânica', description: 'Cactos, coqueiros, rosas, girassóis, bonsai e folhas.', iconName: 'Flower2', enabled: true },
  { id: 'ecologia_reciclagem', name: 'Ecologia & Sustentabilidade', description: 'Energia solar, turbinas eólicas, reciclagem e preservação.', iconName: 'Globe', enabled: true },

  // 21-30: Gastronomia, Comidas & Bebidas
  { id: 'comidas', name: 'Lanches & Fast Food', description: 'Hambúrguer, pizza, batata frita, cachorro-quente e pipoca.', iconName: 'Pizza', enabled: true },
  { id: 'frutas_horta', name: 'Frutas & Verduras', description: 'Abacaxi, melancia, banana, morango, cenoura e alimentos frescos.', iconName: 'Apple', enabled: true },
  { id: 'doces_sobremesas', name: 'Doces, Bolos & Sobremesas', description: 'Sorvete, brigadeiro, pudim, rosquinhas, chocolate e confeitaria.', iconName: 'Cake', enabled: true },
  { id: 'padaria_cafe', name: 'Padaria & Café da Manhã', description: 'Pão francês, xícara de café, croissant, queijo, ovos e panqueca.', iconName: 'Coffee', enabled: true },
  { id: 'churrasco_cozinha', name: 'Churrasco & Culinária', description: 'Churrasqueira, espeto, panela de pressão, frigideira e temperos.', iconName: 'Utensils', enabled: true },
  { id: 'comida_oriental', name: 'Culinária pelo Mundo', description: 'Sushi, taco mexicano, macarrão italiano, fondue e pratos típicos.', iconName: 'Utensils', enabled: true },
  { id: 'bebidas_refrescos', name: 'Bebidas & Refrescos', description: 'Água de coco, suco, milkshake, garrafa térmica e refrigerante.', iconName: 'Droplets', enabled: true },
  { id: 'cozinha_utensilios', name: 'Utensílios de Cozinha', description: 'Liquidificador, batedeira, saca-rolhas, ralador, bule e talheres.', iconName: 'Coffee', enabled: true },
  { id: 'supermercado', name: 'Supermercado & Compras', description: 'Carrinho de compras, código de barras, sacola, caixa e balança.', iconName: 'ShoppingCart', enabled: true },
  { id: 'festa_aniversario', name: 'Festa de Aniversário', description: 'Balões, presentes, vela, chapéu de festa, confete e pinhata.', iconName: 'Gift', enabled: true },

  // 31-40: Casa, Cotidiano, Moda & Objetos
  { id: 'objetos', name: 'Objetos do Cotidiano', description: 'Chaves, guarda-chuva, cadeado, tesoura, óculos e itens diários.', iconName: 'Lamp', enabled: true },
  { id: 'casa_moveis', name: 'Móveis & Sala de Estar', description: 'Sofá, estante, poltrona, tapete, cortina, espelho e televisão.', iconName: 'Home', enabled: true },
  { id: 'eletrodomesticos', name: 'Eletrodomésticos', description: 'Geladeira, máquina de lavar, micro-ondas, aspirador e ferro.', iconName: 'Tv', enabled: true },
  { id: 'banheiro_higiene', name: 'Banheiro & Higiene Pessoal', description: 'Chuveiro, escova de dentes, sabonete, banheira, pente e toalha.', iconName: 'Droplets', enabled: true },
  { id: 'quarto_sono', name: 'Quarto & Hora de Dormir', description: 'Cama, travesseiro, despertador, abajur, cabide e cobertor.', iconName: 'Clock', enabled: true },
  { id: 'roupas_moda', name: 'Roupas & Vestuário', description: 'Camiseta, vestido, jaqueta, calça jeans, meia, gravata e terno.', iconName: 'Shirt', enabled: true },
  { id: 'calcados_chapeus', name: 'Calçados, Bolsas & Chapéus', description: 'Tênis, bota, chinelo, mochila, mala de viagem, boné e coroa.', iconName: 'Briefcase', enabled: true },
  { id: 'joias_relogios', name: 'Joias, Relógios & Tesouros', description: 'Diamante, anel, colar de pérolas, relógio de bolso e ouro.', iconName: 'Gem', enabled: true },
  { id: 'jardim_quintal', name: 'Quintal, Jardim & Piscina', description: 'Cortador de grama, regador, mangueira, cerca, rede e boia.', iconName: 'Sun', enabled: true },
  { id: 'ferramentas_caseiras', name: 'Caixa de Ferramentas', description: 'Chave de fenda, alicate, trena, escada, cadeado e lanterna.', iconName: 'Key', enabled: true },

  // 41-50: Transportes, Viagens & Lugares
  { id: 'transporte', name: 'Carros & Rodovias', description: 'Carro esportivo, caminhão, ônibus, semáforo, placa e pedágio.', iconName: 'Car', enabled: true },
  { id: 'aviacao_ceu', name: 'Aviação & Aeroporto', description: 'Avião comercial, helicóptero, balão de ar quente, paraquedas e jato.', iconName: 'Plane', enabled: true },
  { id: 'navios_nautica', name: 'Barcos, Navios & Náutica', description: 'Submarino, veleiro, navio cruzeiro, bote, remo, farol e âncora.', iconName: 'Ship', enabled: true },
  { id: 'trens_trilhos', name: 'Trens, Metrô & Duas Rodas', description: 'Locomotiva a vapor, trem-bala, bicicleta, motocicleta e patinete.', iconName: 'Train', enabled: true },
  { id: 'espaco_astronomia', name: 'Espaço & Astronomia', description: 'Foguete, Saturno, astronauta, estação espacial, cometa e lua.', iconName: 'Rocket', enabled: true },
  { id: 'lugares', name: 'Monumentos do Mundo', description: 'Pirâmides, Torre Eiffel, Coliseu, Estátua da Liberdade e Muralha.', iconName: 'MapPin', enabled: true },
  { id: 'acampamento_aventura', name: 'Acampamento & Trilha', description: 'Barraca, fogueira, bússola, binóculos, cantil e saco de dormir.', iconName: 'Tent', enabled: true },
  { id: 'praia_verao', name: 'Praia & Férias de Verão', description: 'Guarda-sol, castelo de areia, prancha, óculos de sol e concha.', iconName: 'Sun', enabled: true },
  { id: 'inverno_neve', name: 'Inverno & Montanha Nevada', description: 'Boneco de neve, iglu, esqui, trenó, lareira, luvas e floco de neve.', iconName: 'Snowflake', enabled: true },
  { id: 'cidade_urbano', name: 'Vida na Cidade', description: 'Arranha-céu, hidrante, ponto de ônibus, ponte, chafariz e praça.', iconName: 'Compass', enabled: true },

  // 51-60: Esportes, Jogos & Entretenimento
  { id: 'esportes', name: 'Esportes com Bola', description: 'Futebol, basquete, vôlei, tênis, boliche, golfe e sinuca.', iconName: 'Trophy', enabled: true },
  { id: 'esportes_radicais', name: 'Esportes Radicais & Lutas', description: 'Skate, surfe, boxe, arco e flecha, esgrima, escalada e karatê.', iconName: 'Dumbbell', enabled: true },
  { id: 'jogos', name: 'Videogames & Geek', description: 'Controle de videogame, fliperama, poção, escudo, coração pixel e VR.', iconName: 'Gamepad2', enabled: true },
  { id: 'jogos_tabuleiro', name: 'Jogos de Mesa & Brinquedos', description: 'Xadrez, dominó, cubo mágico, cartas, dado, pipa, ioiô e pião.', iconName: 'Gamepad2', enabled: true },
  { id: 'festa_diversao', name: 'Parque de Diversões & Circo', description: 'Roda-gigante, montanha-russa, carrossel, tenda de circo e mágico.', iconName: 'PartyPopper', enabled: true },
  { id: 'musica', name: 'Instrumentos Musicais', description: 'Violão, bateria, piano, saxofone, sanfona, harpa e trompete.', iconName: 'Music', enabled: true },
  { id: 'palco_show', name: 'Show, DJ & Estúdio', description: 'Microfone, caixa de som, fone de ouvido, vinil, palco e holofote.', iconName: 'Headphones', enabled: true },
  { id: 'filmes_series', name: 'Cinema & Hollywood', description: 'Claquete, rolo de filme, Oscar, tapete vermelho, câmera e 3D.', iconName: 'Film', enabled: true },
  { id: 'arte_pintura', name: 'Arte, Desenho & Escultura', description: 'Paleta de tintas, cavalete, pincel, estátua, origami e moldura.', iconName: 'Palette', enabled: true },
  { id: 'fotografia_midia', name: 'Fotografia & Comunicação', description: 'Câmera fotográfica, tripé, jornal, megafone, carta e antena.', iconName: 'Camera', enabled: true },

  // 61-70: Fantasia, História, Cultura & Mistério
  { id: 'fantasia', name: 'Criaturas Míticas & Magia', description: 'Dragão, unicórnio, sereia, fênix, gênio da lâmpada e caldeirão.', iconName: 'Wand2', enabled: true },
  { id: 'medieval_castelo', name: 'Mundo Medieval & Castelos', description: 'Castelo, cavaleiro, espada, escudo, catapulta, trono e armadura.', iconName: 'Castle', enabled: true },
  { id: 'piratas_mares', name: 'Piratas dos Sete Mares', description: 'Navio pirata, baú do tesouro, mapa, luneta, papagaio e gancho.', iconName: 'Skull', enabled: true },
  { id: 'velho_oeste', name: 'Velho Oeste & Cowboys', description: 'Chapéu de cowboy, xerife, ferradura, carroça, cacto e laço.', iconName: 'Compass', enabled: true },
  { id: 'egito_antigo', name: 'Egito Antigo & Arqueologia', description: 'Faraó, múmia, esfinge, sarcófago, camelo, escaravelho e oásis.', iconName: 'Crown', enabled: true },
  { id: 'mitologia_viking', name: 'Mitologia Grega & Vikings', description: 'Martelo de Thor, tridente, barco viking, Pégaso e Cavalo de Troia.', iconName: 'Sword', enabled: true },
  { id: 'terror_halloween', name: 'Mistério & Halloween', description: 'Abóbora de Halloween, fantasma, morcego, teia, castelo assombrado.', iconName: 'Ghost', enabled: true },
  { id: 'espionagem_detetive', name: 'Detetive & Espionagem', description: 'Lupa, pegadas, cofre, impressão digital, disfarce e periscópio.', iconName: 'Shield', enabled: true },
  { id: 'alienigenas_scifi', name: 'Ficção Científica & OVNIs', description: 'Disco voador, alienígena, sabre de luz, portal do tempo e laser.', iconName: 'Sparkles', enabled: true },
  { id: 'brasil', name: 'Cultura & Símbolos do Brasil', description: 'Cristo Redentor, capivara, chimarrão, pandeiro, açaí e berimbau.', iconName: 'Sun', enabled: true },

  // 71-80: Ciência, Escola, Saúde & Profissões
  { id: 'profissoes', name: 'Profissões & Carreiras', description: 'Bombeiro, chef, médico, juiz, astronauta, piloto e carteiro.', iconName: 'Briefcase', enabled: true },
  { id: 'ciencia', name: 'Laboratório & Química', description: 'Microscópio, tubo de ensaio, DNA, átomo, ímã, prisma e béquer.', iconName: 'FlaskConical', enabled: true },
  { id: 'corpo_humano', name: 'Corpo Humano & Anatomia', description: 'Coração, cérebro, esqueleto, pulmão, olho, mão e dente molar.', iconName: 'HeartPulse', enabled: true },
  { id: 'hospital_medicina', name: 'Hospital & Medicina', description: 'Estetoscópio, ambulância, termômetro, curativo, raio-x e maca.', iconName: 'Stethoscope', enabled: true },
  { id: 'escola_estudos', name: 'Escola & Material Escolar', description: 'Mochila, globo terrestre, quadro-negro, compasso, régua e caderno.', iconName: 'GraduationCap', enabled: true },
  { id: 'matematica_geometria', name: 'Matemática & Geometria', description: 'Calculadora, ábaco, cilindro, cubo, pirâmide, transferidor e pi.', iconName: 'BookOpen', enabled: true },
  { id: 'literatura_biblioteca', name: 'Livros & Biblioteca', description: 'Livro aberto, pena com tinteiro, pergaminho, óculos de leitura.', iconName: 'BookOpen', enabled: true },
  { id: 'financas_economia', name: 'Finanças & Cofre', description: 'Cofrinho de porco, saco de moedas, gráfico, balança e carteira.', iconName: 'Coins', enabled: true },
  { id: 'academia_fitness', name: 'Academia & Vida Saudável', description: 'Halter, esteira, corda de pular, garrafa de água e cronômetro.', iconName: 'Dumbbell', enabled: true },
  { id: 'festas_populares', name: 'Festas & Tradições', description: 'Fogueira de São João, bandeirinhas, árvore de Natal, trenó e fogos.', iconName: 'PartyPopper', enabled: true },

  // 81: Misturado
  {
    id: 'misturado',
    name: 'Misturado (Todos os 80 Temas)',
    description: 'Sorteia palavras de qualquer um dos 80 temas do catálogo para máxima surpresa!',
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
      `Pertence ao tema ${themeId}`,
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
    { id: 'w_empilhadeira', text: 'Empilhadeira', accepted: ['empilhador'], hint: 'Veículo industrial com garfos na frente para levantar paletes' },
    { id: 'w_furadeira', text: 'Furadeira', accepted: ['parafusadeira'], hint: 'Ferramenta elétrica portátil com broca giratória' },
    { id: 'w_torno', text: 'Torno Mecânico', difficulty: 'medium', accepted: ['torno', 'torno mecanico'], hint: 'Máquina de oficina que gira peças metálicas para usinagem' },
    { id: 'w_morsa', text: 'Morsa de Bancada', difficulty: 'medium', accepted: ['morsa', 'torno de bancada'], hint: 'Prensa metálica fixa na bancada para segurar peças na oficina' },
    { id: 'w_esmeril', text: 'Esmeril', difficulty: 'medium', accepted: ['moto esmeril', 'lixadeira'], hint: 'Máquina de bancada com duas pedras circulares que giram para afiar metal' },
  ]),

  // 2. ELÉTRICA & ENERGIA
  ...createWordsForTheme('eletrica_energia', [
    { id: 'w_multimetro', text: 'Multímetro', difficulty: 'medium', accepted: ['multimetro', 'voltimetro'], hint: 'Aparelho com pontas de prova usado por eletricistas para medir tensão' },
    { id: 'w_lampada', text: 'Lâmpada', accepted: ['lampada', 'lampada led'], hint: 'Bulbo de vidro luminoso que acende ao ligar o interruptor' },
    { id: 'w_tomada', text: 'Tomada', accepted: ['plugue', 'extensao'], hint: 'Conector na parede com três furinhos onde ligamos aparelhos elétricos' },
    { id: 'w_bateria_pilha', text: 'Pilha Alcalina', accepted: ['pilha', 'bateria'], hint: 'Cilindro energético com polo positivo e negativo' },
    { id: 'w_transformador', text: 'Poste de Luz', accepted: ['poste', 'transformador'], hint: 'Coluna alta na rua que sustenta fios elétricos e iluminação' },
    { id: 'w_disjuntor', text: 'Disjuntor', difficulty: 'medium', accepted: ['quadro de forca', 'fusivel'], hint: 'Chave de segurança no quadro de luz que desarma em curto-circuito' },
  ]),

  // 3. ROBÓTICA & AUTOMAÇÃO
  ...createWordsForTheme('automacao_robotica', [
    { id: 'w_braco_robotico', text: 'Braço Robótico', accepted: ['braco robotico', 'robo industrial'], hint: 'Máquina articulada automatizada típica de linhas de montagem' },
    { id: 'w_robo', text: 'Robô', accepted: ['robo', 'androide'], hint: 'Máquina programável com sensores e estrutura metálica' },
    { id: 'w_drone', text: 'Drone', accepted: ['quadricoptero'], hint: 'Veículo aéreo controlado remotamente com quatro hélices' },
    { id: 'w_esteira_ind', text: 'Esteira Rolante', accepted: ['esteira', 'esteira industrial'], hint: 'Tapete mecânico que transporta caixas e produtos na fábrica' },
    { id: 'w_impressora3d', text: 'Impressora 3D', accepted: ['impressora 3d'], hint: 'Máquina que cria peças tridimensionais camada por camada' },
    { id: 'w_placa_circuito', text: 'Microchip', accepted: ['chip', 'arduino', 'placa eletronica'], hint: 'Pequena peça quadrada cheia de perninhas metálicas no computador' },
  ]),

  // 4. MECÂNICA AUTOMOTIVA
  ...createWordsForTheme('mecanica_autos', [
    { id: 'w_pneu', text: 'Pneu', accepted: ['roda', 'estepe'], hint: 'Borracha preta circular cheia de ar que equipa as rodas do carro' },
    { id: 'w_volante', text: 'Volante', accepted: ['direcao'], hint: 'Aro circular que o motorista gira para dirigir o veículo' },
    { id: 'w_pistao', text: 'Pistão de Motor', difficulty: 'medium', accepted: ['pistao', 'motor'], hint: 'Peça cilíndrica que sobe e desce dentro do bloco do motor' },
    { id: 'w_macaco_hid', text: 'Macaco Hidráulico', accepted: ['macaco'], hint: 'Equipamento colocado sob o carro para levantá-lo e trocar o pneu' },
    { id: 'w_velocimetro', text: 'Velocímetro', accepted: ['velocimetro', 'painel'], hint: 'Mostrador com ponteiro no painel do carro que marca os km/h' },
    { id: 'w_vela_ignicao', text: 'Amortecedor', accepted: ['mola', 'suspensao'], hint: 'Peça com mola espiral que absorve os impactos das rodas nos buracos' },
  ]),

  // 5. SEGURANÇA DO TRABALHO (EPI)
  ...createWordsForTheme('seguranca_epi', [
    { id: 'w_capacete_epi', text: 'Capacete de Segurança', accepted: ['capacete', 'epi', 'capacete epi'], hint: 'Equipamento rígido usado na cabeça em fábricas e obras' },
    { id: 'w_extintor', text: 'Extintor', accepted: ['extintor de incendio'], hint: 'Cilindro vermelho pressurizado para apagar incêndios' },
    { id: 'w_abafador', text: 'Protetor Auricular', accepted: ['abafador', 'abafador de ruido'], hint: 'Conchas usadas sobre as orelhas para proteger contra barulho de máquinas' },
    { id: 'w_cone_seg', text: 'Cone de Sinalização', accepted: ['cone', 'cone de transito'], hint: 'Objeto cônico laranja e branco usado para isolar áreas' },
    { id: 'w_luva_epi', text: 'Luva de Proteção', accepted: ['luva', 'luvas'], hint: 'Vestimenta de cinco dedos para proteger as mãos do trabalhador' },
    { id: 'w_mascara_gas', text: 'Máscara de Proteção', accepted: ['mascara', 'respirador'], hint: 'Equipamento colocado no rosto para filtrar poeira e gases' },
  ]),

  // 6. SOLDAGEM & METALURGIA
  ...createWordsForTheme('solda_metalurgia', [
    { id: 'w_soldador', text: 'Máquina de Solda', accepted: ['solda', 'soldador', 'mascara de solda'], hint: 'Equipamento que une metais usando calor intenso e faíscas' },
    { id: 'w_bigorna', text: 'Bigorna', hint: 'Bloco pesado de ferro onde o ferreiro martela metais quentes' },
    { id: 'w_corrente', text: 'Corrente de Ferro', accepted: ['corrente'], hint: 'Sequência de elos metálicos interligados muito resistente' },
    { id: 'w_macarico', text: 'Maçarico', accepted: ['macarico'], hint: 'Bico conectado a gás que solta uma chama azul fortíssima' },
    { id: 'w_ferradura_met', text: 'Barra de Ouro', accepted: ['lingote', 'ouro'], hint: 'Tijolo metálico reluzente guardado em cofres de bancos' },
  ]),

  // 7. MARCENARIA & CARPINTARIA
  ...createWordsForTheme('marcenaria_madeira', [
    { id: 'w_serrote', text: 'Serrote', accepted: ['serra'], hint: 'Lâmina dentada com cabo de madeira usada para cortar tábuas' },
    { id: 'w_martelo', text: 'Martelo', hint: 'Ferramenta clássica usada para bater pregos na madeira' },
    { id: 'w_machado', text: 'Machado', hint: 'Ferramenta de lenhador com cabo longo e lâmina para cortar troncos' },
    { id: 'w_parafuso', text: 'Parafuso', accepted: ['porca e parafuso', 'prego'], hint: 'Pino metálico com rosca espiral apertado com chave de fenda' },
    { id: 'w_tronco', text: 'Tronco de Madeira', accepted: ['tronco', 'lenha', 'tora'], hint: 'Parte cilíndrica da árvore cortada com anéis no interior' },
  ]),

  // 8. ENGENHARIA & CONSTRUÇÃO CIVIL
  ...createWordsForTheme('construcao', [
    { id: 'w_guindaste', text: 'Guindaste', accepted: ['grua'], hint: 'Torre metálica muito alta usada em obras para içar cargas pesadas' },
    { id: 'w_escavadeira', text: 'Escavadeira', accepted: ['trator', 'retroescavadeira'], hint: 'Máquina amarela pesada com braço hidráulico e concha para cavar terra' },
    { id: 'w_carrinho_mao', text: 'Carrinho de Mão', accepted: ['carrinho de mao', 'carriola'], hint: 'Caçamba com uma roda na frente e duas alças para transportar cimento' },
    { id: 'w_betoneira', text: 'Betoneira', difficulty: 'medium', hint: 'Tambor giratório de obra usado para misturar cimento, água e areia' },
    { id: 'w_parede_tijolo', text: 'Muro de Tijolos', accepted: ['tijolo', 'tijolos', 'parede'], hint: 'Blocos de barro cozido empilhados com cimento pelo pedreiro' },
    { id: 'w_rolo_pintura', text: 'Rolo de Pintura', accepted: ['rolo de tinta'], hint: 'Cilindro macio com cabo usado para pintar paredes rapidamente' },
  ]),

  // 9. TECNOLOGIA & INFORMÁTICA
  ...createWordsForTheme('tecnologia', [
    { id: 'w_notebook', text: 'Notebook', accepted: ['laptop', 'computador'], hint: 'Computador portátil que abre e fecha com tela e teclado integrados' },
    { id: 'w_mouse', text: 'Mouse', accepted: ['rato de computador'], hint: 'Periférico de mão usado para mover o cursor na tela do PC' },
    { id: 'w_teclado', text: 'Teclado', accepted: ['teclado mecanico'], hint: 'Periférico cheio de teclas com letras e números para digitar' },
    { id: 'w_pendrive', text: 'Pendrive', accepted: ['pen drive', 'memoria usb'], hint: 'Pequeno dispositivo USB de bolso para guardar arquivos' },
    { id: 'w_webcam', text: 'Webcam', accepted: ['camera de computador'], hint: 'Pequena câmera colocada em cima do monitor para videochamadas' },
    { id: 'w_impressora', text: 'Impressora', hint: 'Aparelho conectado ao computador que passa texto e imagem para o papel' },
  ]),

  // 10. INTERNET & MUNDO DIGITAL
  ...createWordsForTheme('internet_redes', [
    { id: 'w_roteador', text: 'Roteador Wi-Fi', accepted: ['roteador', 'wifi', 'modem'], hint: 'Aparelho com antenas que distribui internet sem fio pela casa' },
    { id: 'w_smartphone', text: 'Smartphone', accepted: ['celular', 'telefone'], hint: 'Aparelho de bolso com tela sensível ao toque e aplicativos' },
    { id: 'w_qrcode', text: 'QR Code', accepted: ['codigo qr'], hint: 'Quadrado cheio de pontinhos pretos e brancos lido pela câmera do celular' },
    { id: 'w_arroba', text: 'Arroba', accepted: ['simbolo arroba', 'email'], hint: 'Letra "a" cercada por um círculo usada em todos os endereços de e-mail' },
    { id: 'w_satelite', text: 'Satélite Artificial', accepted: ['satelite'], hint: 'Equipamento com placas solares que orbita a Terra enviando sinais' },
  ]),

  // 11. ANIMAIS SELVAGENS
  ...createWordsForTheme('animais', [
    { id: 'w_girafa', text: 'Girafa', accepted: ['girafas'], hint: 'Mamífero africano com o pescoço mais longo do reino animal' },
    { id: 'w_elefante', text: 'Elefante', hint: 'Maior mamífero terrestre, possui grandes orelhas e uma longa tromba' },
    { id: 'w_leao', text: 'Leão', accepted: ['leao'], hint: 'Conhecido como o rei da selva, possui uma grande juba ao redor da cabeça' },
    { id: 'w_canguru', text: 'Canguru', hint: 'Animal australiano que salta e carrega o filhote numa bolsa' },
    { id: 'w_preguica', text: 'Bicho-Preguiça', accepted: ['preguica', 'bicho preguica'], hint: 'Mamífero muito lento que vive pendurado nos galhos das árvores' },
    { id: 'w_rinoceronte', text: 'Rinoceronte', hint: 'Grande mamífero pesado que possui um chifre forte sobre o nariz' },
    { id: 'w_zebra', text: 'Zebra', hint: 'Animal africano parecido com o cavalo, todo listrado de preto e branco' },
    { id: 'w_panda', text: 'Urso Panda', accepted: ['panda'], hint: 'Urso preto e branco fofinho que adora comer bambu' },
  ]),

  // 12. PETS & FAZENDINHA
  ...createWordsForTheme('pets_fazenda', [
    { id: 'w_cachorro', text: 'Cachorro', accepted: ['cao', 'cão'], hint: 'Melhor amigo do homem, late e abana o rabo' },
    { id: 'w_gato', text: 'Gato', accepted: ['gatinho'], hint: 'Felino doméstico que mia, ronrona e adora caçar novelos de lã' },
    { id: 'w_vaca', text: 'Vaca', accepted: ['boi'], hint: 'Animal da fazenda com manchas malhadas que produz leite' },
    { id: 'w_porco', text: 'Porco', accepted: ['leitão', 'porquinho'], hint: 'Animal rosado da fazenda com focinho redondo e rabinho enrolado' },
    { id: 'w_ovelha', text: 'Ovelha', accepted: ['carneiro'], hint: 'Animal de fazenda coberto de lã branca e macia' },
    { id: 'w_coelho', text: 'Coelho', hint: 'Animal orelhudo que pula rápido e adora roer cenoura' },
    { id: 'w_cavalo', text: 'Cavalo', hint: 'Animal veloz de crina usado para cavalgar com sela e rédeas' },
  ]),

  // 13. AVES & PÁSSAROS
  ...createWordsForTheme('aves_passaros', [
    { id: 'w_pinguim', text: 'Pinguim', accepted: ['pinguins'], hint: 'Ave que não voa, vive no gelo e parece usar smoking' },
    { id: 'w_coruja', text: 'Coruja', accepted: ['mocho'], hint: 'Ave noturna de olhos grandes que gira a cabeça quase toda' },
    { id: 'w_flamengo_ave', text: 'Flamingo', hint: 'Ave de penas cor-de-rosa que costuma ficar apoiada em uma perna só' },
    { id: 'w_pavao', text: 'Pavão', accepted: ['pavao'], hint: 'Ave famosa por abrir sua cauda em um grande leque colorido' },
    { id: 'w_aguia', text: 'Águia', accepted: ['aguia', 'gaviao'], hint: 'Grande ave de rapina de bico curvo que voa no topo das montanhas' },
    { id: 'w_beijaflor', text: 'Beija-Flor', accepted: ['beija flor', 'colibri'], hint: 'Pequeno pássaro de bico fino que bate as asas rápido diante das flores' },
    { id: 'w_avestruz', text: 'Avestruz', accepted: ['ema'], hint: 'Ave gigante de pescoço e pernas compridas que corre muito rápido' },
  ]),

  // 14. FUNDO DO MAR & OCEANO
  ...createWordsForTheme('mar_oceano', [
    { id: 'w_polvo', text: 'Polvo', accepted: ['octopus'], hint: 'Animal marinho inteligente com oito tentáculos e ventosas' },
    { id: 'w_tubarao', text: 'Tubarão', accepted: ['tubarao'], hint: 'Predador dos oceanos com barbatana triangular e dentes afiados' },
    { id: 'w_agua_viva', text: 'Água-Viva', accepted: ['agua viva', 'medusa'], hint: 'Animal marinho transparente em forma de guarda-chuva com tentáculos' },
    { id: 'w_cavalo_marinho', text: 'Cavalo-Marinho', accepted: ['cavalo marinho'], hint: 'Pequeno peixe de nado vertical com cabeça parecida com a de um cavalo' },
    { id: 'w_baleia', text: 'Baleia', hint: 'Gigante dos oceanos que solta um esguicho de água pelo topo' },
    { id: 'w_caranguejo', text: 'Caranguejo', accepted: ['siri', 'lagosta'], hint: 'Crustáceo vermelho que anda de lado na areia e tem duas garras' },
    { id: 'w_estrela_mar', text: 'Estrela-do-Mar', accepted: ['estrela do mar'], hint: 'Animal marinho de cinco pontas que vive no fundo do oceano' },
  ]),

  // 15. INSETOS & VIDA NO JARDIM
  ...createWordsForTheme('insetos_jardim', [
    { id: 'w_borboleta', text: 'Borboleta', hint: 'Inseto com grandes asas coloridas e simétricas que antes era lagarta' },
    { id: 'w_abelha', text: 'Abelha', hint: 'Inseto listrado de amarelo e preto que produz mel na colmeia' },
    { id: 'w_joaninha', text: 'Joaninha', hint: 'Pequeno besouro arredondado vermelho com pintinhas pretas' },
    { id: 'w_caracol', text: 'Caracol', accepted: ['caramujo'], hint: 'Anda bem devagar pelo jardim carregando uma concha espiral nas costas' },
    { id: 'w_formiga', text: 'Formiga', hint: 'Inseto trabalhador que carrega folhas maiores que ele para o formigueiro' },
    { id: 'w_escorpiao', text: 'Escorpião', accepted: ['escorpiao'], hint: 'Aracnídeo com duas pinças na frente e um ferrão curvado na cauda' },
  ]),

  // 16. RÉPTEIS & ANFÍBIOS
  ...createWordsForTheme('repteis_anfibios', [
    { id: 'w_camaleao', text: 'Camaleão', difficulty: 'medium', accepted: ['camaleao'], hint: 'Réptil famoso por mudar de cor e ter língua comprida' },
    { id: 'w_tartaruga', text: 'Tartaruga', accepted: ['jabuti'], hint: 'Réptil lento que carrega um casco duro de proteção nas costas' },
    { id: 'w_jacare', text: 'Jacaré', accepted: ['jacare', 'crocodilo'], hint: 'Réptil aquático verde de boca comprida cheia de dentes' },
    { id: 'w_sapo', text: 'Sapo', accepted: ['rã', 'perereca'], hint: 'Anfíbio verde que coaxa na lagoa e dá grandes saltos' },
    { id: 'w_cobra', text: 'Cobra Naja', accepted: ['cobra', 'serpente', 'naja'], hint: 'Réptil sem patas que rasteja e põe a língua bifurcada para fora' },
  ]),

  // 17. DINOSSAUROS & PRÉ-HISTÓRIA
  ...createWordsForTheme('dinossauros_prehistoria', [
    { id: 'w_dinossauro', text: 'Tiranossauro Rex', accepted: ['dinossauro', 't-rex', 'tiranossauro'], hint: 'Dinossauro gigante carnívoro de braços curtos' },
    { id: 'w_triceratops', text: 'Tricerátops', difficulty: 'medium', accepted: ['triceratops'], hint: 'Dinossauro herbívoro com três chifres e um escudo ósseo na cabeça' },
    { id: 'w_pterodactilo', text: 'Pterodáctilo', difficulty: 'medium', accepted: ['pterodactilo', 'dinossauro voador'], hint: 'Réptil voador pré-histórico com grandes asas e bico pontudo' },
    { id: 'w_mamute', text: 'Mamute', hint: 'Parente pré-histórico peludo do elefante com longas presas curvas' },
    { id: 'w_fossil', text: 'Fóssil', accepted: ['fossil', 'esqueleto de dinossauro'], hint: 'Ossos ou pegadas pré-históricas preservadas dentro da rocha' },
  ]),

  // 18. CLIMA & FENÔMENOS NATURAIS
  ...createWordsForTheme('natureza', [
    { id: 'w_vulcao', text: 'Vulcão', accepted: ['vulcao'], hint: 'Montanha com cratera que cospe fumaça e lava quente' },
    { id: 'w_arcoiris', text: 'Arco-íris', accepted: ['arco iris'], hint: 'Arco de sete cores que surge no céu quando há sol e chuva' },
    { id: 'w_tornado', text: 'Tornado', difficulty: 'medium', accepted: ['furacao', 'redemoinho'], hint: 'Funil gigante de vento giratório que toca o chão' },
    { id: 'w_cachoeira', text: 'Cachoeira', accepted: ['cascata'], hint: 'Queda de água natural de um rio sobre um paredão de pedras' },
    { id: 'w_relampago', text: 'Relâmpago', accepted: ['relampago', 'raio', 'trovao'], hint: 'Clarão elétrico em zigue-zague que corta o céu na tempestade' },
    { id: 'w_iceberg', text: 'Iceberg', hint: 'Bloco gigante de gelo flutuando no oceano gelado' },
  ]),

  // 19. ÁRVORES, FLORES & BOTÂNICA
  ...createWordsForTheme('plantas_botanica', [
    { id: 'w_cacto', text: 'Cacto', accepted: ['cactus'], hint: 'Planta verde cheia de espinhos típica do deserto' },
    { id: 'w_girassol', text: 'Girassol', hint: 'Flor alta de pétalas amarelas que acompanha a posição do sol' },
    { id: 'w_coqueiro', text: 'Coqueiro', accepted: ['palmeira'], hint: 'Árvore alta típica da praia com folhas grandes e cocos no topo' },
    { id: 'w_rosa', text: 'Rosa', accepted: ['flor'], hint: 'Flor romântica perfumada que possui espinhos no caule' },
    { id: 'w_trevo', text: 'Trevo de Quatro Folhas', accepted: ['trevo'], hint: 'Pequena planta verde considerada amuleto de boa sorte' },
    { id: 'w_planta_carnivora', text: 'Planta Carnívora', accepted: ['planta carnivora'], hint: 'Planta exótica que fecha suas folhas como uma boca para pegar moscas' },
  ]),

  // 20. ECOLOGIA & SUSTENTABILIDADE
  ...createWordsForTheme('ecologia_reciclagem', [
    { id: 'w_placa_solar', text: 'Painel Solar', accepted: ['placa solar', 'energia solar'], hint: 'Placa azulada instalada no telhado que capta a luz do sol' },
    { id: 'w_turbina_eolica', text: 'Turbina Eólica', accepted: ['catavento gigante', 'energia eolica', 'moinho de vento'], hint: 'Torre branca alta com três grandes pás que giram com o vento' },
    { id: 'w_lixeira_reciclavel', text: 'Lixeira de Reciclagem', accepted: ['lixeira', 'reciclagem', 'coleta seletiva'], hint: 'Recipiente colorido com o símbolo de três setas em triângulo' },
    { id: 'w_mudinha', text: 'Brotinho de Planta', accepted: ['muda', 'planta', 'sementinha'], hint: 'Pequena planta nascendo da terra com duas folhinhas verdes' },
  ]),

  // 21. LANCHES & FAST FOOD
  ...createWordsForTheme('comidas', [
    { id: 'w_hamburguer', text: 'Hambúrguer', accepted: ['hamburguer', 'xis', 'cheeseburger'], hint: 'Sanduíche com pão com gergelim, carne, queijo e alface' },
    { id: 'w_pizza', text: 'Pizza', hint: 'Massa redonda fatiada em triângulos com queijo derretido' },
    { id: 'w_pipoca', text: 'Pipoca', accepted: ['balde de pipoca'], hint: 'Milho estourado indispensável na sessão de cinema' },
    { id: 'w_batata_frita', text: 'Batata Frita', accepted: ['batatas fritas'], hint: 'Palitinhos dourados e crocantes servidos numa caixinha vermelha' },
    { id: 'w_cachorro_quente', text: 'Cachorro-Quente', accepted: ['cachorro quente', 'hot dog'], hint: 'Pão comprido recheado com salsicha, ketchup e mostarda' },
    { id: 'w_coxinha', text: 'Coxinha', hint: 'Salgado brasileiro frito em formato de gota recheado com frango' },
  ]),

  // 22. FRUTAS & VERDURAS
  ...createWordsForTheme('frutas_horta', [
    { id: 'w_abacaxi', text: 'Abacaxi', accepted: ['ananas'], hint: 'Fruta tropical espinhosa com uma coroa verde no topo' },
    { id: 'w_melancia', text: 'Melancia', hint: 'Fruta grande verde por fora e vermelha por dentro cheia de sementinhas pretas' },
    { id: 'w_banana', text: 'Banana', accepted: ['cacho de banana'], hint: 'Fruta amarela curvada que descascamos em tiras' },
    { id: 'w_morango', text: 'Morango', hint: 'Pequena fruta vermelha docinha com folhinhas verdes e pontinhos' },
    { id: 'w_cenoura', text: 'Cenoura', hint: 'Raiz alaranjada comprida que os coelhos adoram comer' },
    { id: 'w_uva', text: 'Cacho de Uvas', accepted: ['uva', 'uvas'], hint: 'Frutinhas redondas roxas ou verdes presas num mesmo cabinho' },
  ]),

  // 23. DOCES, BOLOS & SOBREMESAS
  ...createWordsForTheme('doces_sobremesas', [
    { id: 'w_sorvete', text: 'Sorvete', accepted: ['casquinha', 'picole'], hint: 'Sobremesa gelada servida em bolas na casquinha de biscoito' },
    { id: 'w_brigadeiro', text: 'Brigadeiro', hint: 'Doce brasileiro de chocolate enrolado com granulado' },
    { id: 'w_rosquinha', text: 'Rosquinha', accepted: ['donut', 'donuts'], hint: 'Doce redondo com um furo no meio e cobertura rosa com confeitos' },
    { id: 'w_pirulito', text: 'Pirulito', hint: 'Doce redondo colorido espiralado preso na ponta de um palito' },
    { id: 'w_pudim', text: 'Pudim', hint: 'Sobremesa redonda com furo no meio e calda de caramelo' },
    { id: 'w_barra_choc', text: 'Barra de Chocolate', accepted: ['chocolate'], hint: 'Doce marrom dividido em quadradinhos embalado em papel alumínio' },
  ]),

  // 24. PADARIA & CAFÉ DA MANHÃ
  ...createWordsForTheme('padaria_cafe', [
    { id: 'w_croissant', text: 'Croissant', difficulty: 'medium', accepted: ['pao meia lua'], hint: 'Pão folhado francês em formato de meia-lua' },
    { id: 'w_xicara_cafe', text: 'Xícara de Café', accepted: ['cafe', 'xicara'], hint: 'Bebida escura quentinha saindo fumaça na manhã' },
    { id: 'w_ovo_frito', text: 'Ovo Frito', accepted: ['ovo'], hint: 'Clara branca redonda com uma gema amarela brilhante no meio' },
    { id: 'w_queijo', text: 'Fatia de Queijo', accepted: ['queijo'], hint: 'Alimento amarelo cheio de furinhos que os ratos adoram nos desenhos' },
    { id: 'w_panqueca', text: 'Panquecas', accepted: ['panqueca', 'waffle'], hint: 'Discos de massa empilhados no prato com calda escorrendo' },
  ]),

  // 25. CHURRASCO & CULINÁRIA
  ...createWordsForTheme('churrasco_cozinha', [
    { id: 'w_churrasqueira', text: 'Churrasqueira', accepted: ['churrasco', 'grelha'], hint: 'Estrutura com carvão em brasa e grelha para assar carne' },
    { id: 'w_espetinho', text: 'Espetinho', accepted: ['espeto de carne'], hint: 'Pedaços de carne e legumes assados em um palito comprido' },
    { id: 'w_panela_pressao', text: 'Panela de Pressão', accepted: ['panela de pressao', 'panela'], hint: 'Panela fechada que apita e solta vapor pela válvula no fogão' },
    { id: 'w_frigideira', text: 'Frigideira', hint: 'Panela rasa de cabo comprido usada para fritar ovos e bifes' },
  ]),

  // 26. CULINÁRIA PELO MUNDO
  ...createWordsForTheme('comida_oriental', [
    { id: 'w_sushi', text: 'Sushi', accepted: ['sashimi', 'comida japonesa'], hint: 'Rolinho japonês de arroz com alga nori e salmão sobre hashis' },
    { id: 'w_lasanha', text: 'Lasanha', difficulty: 'medium', hint: 'Prato italiano assado em camadas de massa, molho e queijo' },
    { id: 'w_taco', text: 'Taco Mexicano', accepted: ['taco', 'nachos'], hint: 'Tortilha dobrada em meia-lua recheada típica do México' },
    { id: 'w_espaguete', text: 'Espaguete', accepted: ['macarrao', 'macarrão'], hint: 'Fios longos de massa enrolados no garfo com almôndegas' },
  ]),

  // 27. BEBIDAS & REFRESCOS
  ...createWordsForTheme('bebidas_refrescos', [
    { id: 'w_agua_coco', text: 'Água de Coco', accepted: ['coco', 'coco verde'], hint: 'Fruta verde redonda furada no topo com um canudinho na praia' },
    { id: 'w_milkshake', text: 'Milkshake', hint: 'Copo alto de bebida batida com sorvete, chantilly e cereja no topo' },
    { id: 'w_jarra_suco', text: 'Jarra de Suco', accepted: ['jarra', 'suco de laranja'], hint: 'Recipiente de vidro com alça e bico cheio de bebida gelada com gelo' },
    { id: 'w_garrafa_termica', text: 'Garrafa Térmica', accepted: ['garrafa de cafe'], hint: 'Garrafa que mantém o café quente por muitas horas' },
  ]),

  // 28. UTENSÍLIOS DE COZINHA
  ...createWordsForTheme('cozinha_utensilios', [
    { id: 'w_liquidificador', text: 'Liquidificador', hint: 'Aparelho com copo transparente e hélices no fundo para bater vitaminas' },
    { id: 'w_torradeira', text: 'Torradeira', hint: 'Aparelho elétrico onde as fatias de pão pulam quentes para cima' },
    { id: 'w_chaleira', text: 'Chaleira', accepted: ['bule'], hint: 'Vasilha com bico curvado que apita quando a água ferve' },
    { id: 'w_rolo_massa', text: 'Rolo de Massa', accepted: ['rolo de macarrao'], hint: 'Cilindro de madeira com dois cabos usado para esticar massa de pizza' },
  ]),

  // 29. SUPERMERCADO & COMPRAS
  ...createWordsForTheme('supermercado', [
    { id: 'w_carrinho_compras', text: 'Carrinho de Compras', accepted: ['carrinho de supermercado'], hint: 'Cesto metálico gradeado com quatro rodinhas empurrado no mercado' },
    { id: 'w_codigo_barras', text: 'Código de Barras', accepted: ['codigo de barras'], hint: 'Listras verticais pretas e brancas com números lidas no caixa' },
    { id: 'w_caixa_reg', text: 'Caixa Registradora', accepted: ['registradora'], hint: 'Máquina de loja onde ficam guardadas as notas e moedas' },
    { id: 'w_sacola', text: 'Sacola de Compras', accepted: ['sacola'], hint: 'Bolsa com alças usada para levar os produtos para casa' },
  ]),

  // 30. FESTA DE ANIVERSÁRIO
  ...createWordsForTheme('festa_aniversario', [
    { id: 'w_bolo_aniversario', text: 'Bolo de Aniversário', accepted: ['bolo', 'bolo de aniversario'], hint: 'Doce confeitado com velinhas acesas no topo para cantar parabéns' },
    { id: 'w_caixa_presente', text: 'Caixa de Presente', accepted: ['presente'], hint: 'Pacote embrulhado com fita e um grande laço no topo' },
    { id: 'w_balao_festa', text: 'Bexiga de Festa', accepted: ['balao', 'bexiga'], hint: 'Globo colorido cheio de ar ou gás hélio amarrado num barbante' },
    { id: 'w_chapeu_festa', text: 'Chapéu de Aniversário', accepted: ['chapeu de festa'], hint: 'Cone colorido com elástico e pompom usado na cabeça dos convidados' },
  ]),

  // 31. OBJETOS DO COTIDIANO
  ...createWordsForTheme('objetos', [
    { id: 'w_guardachuva', text: 'Guarda-chuva', accepted: ['guarda chuva', 'sombrinha'], hint: 'Abre-se sobre a cabeça para proteger das gotas de chuva' },
    { id: 'w_ampulheta', text: 'Ampulheta', difficulty: 'medium', accepted: ['relogio de areia'], hint: 'Dois bulbos de vidro que marcam o tempo com areia caindo' },
    { id: 'w_tesoura', text: 'Tesoura', hint: 'Objeto com duas lâminas e argolas para os dedos usado para cortar papel' },
    { id: 'w_chave', text: 'Chave', hint: 'Pequeno objeto metálico dentado usado para destrancar portas' },
    { id: 'w_ventilador', text: 'Ventilador', hint: 'Aparelho com hélices giratórias dentro de uma grade para fazer vento' },
  ]),

  // 32. MÓVEIS & SALA DE ESTAR
  ...createWordsForTheme('casa_moveis', [
    { id: 'w_sofa', text: 'Sofá', accepted: ['sofa', 'poltrona'], hint: 'Móvel estofado com almofadas na sala para sentar e assistir TV' },
    { id: 'w_televisao', text: 'Televisão', accepted: ['tv', 'televisor'], hint: 'Tela grande na sala usada para assistir filmes, novelas e jogos' },
    { id: 'w_cadeira_balanco', text: 'Cadeira de Balanço', accepted: ['cadeira de balanco', 'cadeira'], hint: 'Assento com pés curvados que vai para frente e para trás' },
    { id: 'w_espelho', text: 'Espelho', hint: 'Superfície de vidro na moldura que reflete a sua própria imagem' },
  ]),

  // 33. ELETRODOMÉSTICOS
  ...createWordsForTheme('eletrodomesticos', [
    { id: 'w_geladeira', text: 'Geladeira', accepted: ['refrigerador'], hint: 'Eletrodoméstico alto da cozinha que conserva alimentos gelados' },
    { id: 'w_maquina_lavar', text: 'Máquina de Lavar', accepted: ['maquina de lavar', 'lavadora'], hint: 'Eletrodoméstico com porta redonda de vidro que lava roupas com espuma' },
    { id: 'w_microondas', text: 'Micro-ondas', accepted: ['microondas'], hint: 'Caixa com visor e prato giratório que esquenta comida em segundos' },
    { id: 'w_ferro_passar', text: 'Ferro de Passar', accepted: ['ferro de passar roupa'], hint: 'Aparelho quente com base metálica triangular para desamassar roupas' },
    { id: 'w_aspirador', text: 'Aspirador de Pó', accepted: ['aspirador de po', 'aspirador'], hint: 'Aparelho com mangueira que suga a poeira do tapete' },
  ]),

  // 34. BANHEIRO & HIGIENE PESSOAL
  ...createWordsForTheme('banheiro_higiene', [
    { id: 'w_chuveiro', text: 'Chuveiro', accepted: ['ducha'], hint: 'Instalado no alto do banheiro, solta água para o banho' },
    { id: 'w_escova_dentes', text: 'Escova de Dentes', accepted: ['escova de dente'], hint: 'Cabo com cerdas onde colocamos pasta para limpar os dentes' },
    { id: 'w_banheira', text: 'Banheira', hint: 'Grande recipiente cheio de água morna e bolhas de espuma' },
    { id: 'w_pente', text: 'Pente de Cabelo', accepted: ['pente', 'escova de cabelo'], hint: 'Objeto cheio de dentinhos alinhados usado para arrumar o cabelo' },
  ]),

  // 35. QUARTO & HORA DE DORMIR
  ...createWordsForTheme('quarto_sono', [
    { id: 'w_abajur', text: 'Abajur', accepted: ['luminaria'], hint: 'Luminária de cabeceira com cúpula sobre a mesa do quarto' },
    { id: 'w_despertador', text: 'Relógio Despertador', accepted: ['despertador'], hint: 'Relógio com dois sininhos no topo que toca alto de manhã' },
    { id: 'w_beliche', text: 'Beliche', accepted: ['cama'], hint: 'Duas camas montadas uma em cima da outra com uma escadinha' },
    { id: 'w_cabide', text: 'Cabide', hint: 'Objeto em formato triangular com gancho para pendurar roupas no armário' },
  ]),

  // 36. ROUPAS & VESTUÁRIO
  ...createWordsForTheme('roupas_moda', [
    { id: 'w_gravata', text: 'Gravata', accepted: ['gravata borboleta'], hint: 'Tira de tecido usada no colarinho da camisa social com terno' },
    { id: 'w_cachecol', text: 'Cachecol', hint: 'Faixa de lã enrolada no pescoço durante o inverno frio' },
    { id: 'w_vestido', text: 'Vestido', hint: 'Peça única de roupa feminina com saia rodada' },
    { id: 'w_calca_jeans', text: 'Calça Jeans', accepted: ['calca', 'bermuda'], hint: 'Vestimenta com bolsos e zíper que veste as duas pernas' },
    { id: 'w_meia', text: 'Meia', accepted: ['par de meias'], hint: 'Peça de tecido macio que calçamos nos pés antes do tênis' },
  ]),

  // 37. CALÇADOS, BOLSAS & CHAPÉUS
  ...createWordsForTheme('calcados_chapeus', [
    { id: 'w_chapeu_cowboy', text: 'Chapéu de Cowboy', accepted: ['chapeu', 'bone'], hint: 'Chapéu de abas largas usado no sol' },
    { id: 'w_tenis', text: 'Tênis com Cadarço', accepted: ['tenis', 'sapato'], hint: 'Calçado esportivo amarrado com cadarço para caminhar ou correr' },
    { id: 'w_chinelo', text: 'Chinelo de Dedo', accepted: ['chinelo', 'havaianas', 'sandalia'], hint: 'Calçado aberto de borracha com duas tiras em Y para o calor' },
    { id: 'w_mala_viagem', text: 'Mala de Viagem', accepted: ['mala'], hint: 'Bagagem retangular com rodinhas e alça retrátil levada ao aeroporto' },
  ]),

  // 38. JOIAS, RELÓGIOS & TESOUROS
  ...createWordsForTheme('joias_relogios', [
    { id: 'w_coroa', text: 'Coroa Real', accepted: ['coroa'], hint: 'Adorno de ouro com pedras preciosas usado na cabeça por reis' },
    { id: 'w_relogio_pulso', text: 'Relógio de Pulso', accepted: ['relogio', 'smartwatch'], hint: 'Acessório com pulseira e ponteiros usado no braço para ver as horas' },
    { id: 'w_diamante', text: 'Diamante', accepted: ['pedra preciosa'], hint: 'Cristal lapidado extremamente brilhante e valioso' },
    { id: 'w_anel', text: 'Anel de Noivado', accepted: ['anel', 'alianca'], hint: 'Aro dourado usado no dedo com uma pedrinha brilhante no topo' },
  ]),

  // 39. QUINTAL, JARDIM & PISCINA
  ...createWordsForTheme('jardim_quintal', [
    { id: 'w_regador', text: 'Regador', hint: 'Vasilha com alça e bico cheio de furinhos para molhar as plantas' },
    { id: 'w_rede_descanso', text: 'Rede de Descanso', accepted: ['rede', 'rede de dormir'], hint: 'Tecido suspenso entre dois ganchos na varanda para balançar' },
    { id: 'w_boia', text: 'Boia de Piscina', accepted: ['boia'], hint: 'Anel inflável colorido usado para flutuar na água da piscina' },
    { id: 'w_casinha_cachorro', text: 'Casinha de Cachorro', accepted: ['casinha'], hint: 'Pequena casa de madeira no quintal com entrada arredondada para o pet' },
  ]),

  // 40. CAIXA DE FERRAMENTAS
  ...createWordsForTheme('ferramentas_caseiras', [
    { id: 'w_cadeado', text: 'Cadeado', accepted: ['tranca'], hint: 'Trava metálica em arco que precisa de chave ou segredo para abrir' },
    { id: 'w_lanterna', text: 'Lanterna', hint: 'Tubo portátil com pilha que emite um feixe de luz no escuro' },
    { id: 'w_trena', text: 'Trena', hint: 'Fita métrica enrolada dentro de um estojo usada para medir paredes' },
    { id: 'w_alicate', text: 'Alicate', hint: 'Ferramenta manual articulada usada para segurar ou cortar fios' },
    { id: 'w_escada', text: 'Escada', hint: 'Estrutura com vários degraus usada para alcançar lugares altos' },
  ]),

  // 41. CARROS & RODOVIAS
  ...createWordsForTheme('transporte', [
    { id: 'w_ambulancia', text: 'Ambulância', accepted: ['ambulancia'], hint: 'Furgão branco de resgate médico com sirene vermelha no teto' },
    { id: 'w_semaforo', text: 'Semáforo', accepted: ['semaforo', 'farol', 'sinaleira'], hint: 'Poste de trânsito com três luzes: vermelha, amarela e verde' },
    { id: 'w_caminhao', text: 'Caminhão', accepted: ['caminhao', 'carreta'], hint: 'Veículo grande de muitas rodas que transporta cargas na estrada' },
    { id: 'w_onibus', text: 'Ônibus', accepted: ['onibus'], hint: 'Veículo comprido cheio de janelas e bancos para muitos passageiros' },
  ]),

  // 42. AVIAÇÃO & AEROPORTO
  ...createWordsForTheme('aviacao_ceu', [
    { id: 'w_balaodear', text: 'Balão de Ar Quente', accepted: ['balao', 'balao de ar quente'], hint: 'Voa pelo céu aquecido por fogo levando passageiros num cesto' },
    { id: 'w_helicoptero', text: 'Helicóptero', accepted: ['helicoptero'], hint: 'Aeronave que decola na vertical com grandes hélices no topo' },
    { id: 'w_aviao', text: 'Avião', accepted: ['aviao'], hint: 'Aeronave com duas grandes asas e turbinas que voa acima das nuvens' },
    { id: 'w_paraquedas', text: 'Paraquedas', accepted: ['paraquedismo'], hint: 'Grande cúpula de tecido aberta no céu para descer suavemente' },
  ]),

  // 43. BARCOS, NAVIOS & NÁUTICA
  ...createWordsForTheme('navios_nautica', [
    { id: 'w_submarino', text: 'Submarino', hint: 'Embarcação que navega debaixo da água e usa periscópio' },
    { id: 'w_veleiro', text: 'Barco a Vela', accepted: ['veleiro', 'barco'], hint: 'Embarcação movida pela força do vento em grandes tecidos brancos' },
    { id: 'w_ancora', text: 'Âncora', accepted: ['ancora'], hint: 'Peça pesada de ferro com ganchos lançada ao mar para segurar o navio' },
    { id: 'w_pedalinho', text: 'Caiaque', accepted: ['canoa', 'bote'], hint: 'Pequeno barco estreito impulsionado com remo nas águas' },
  ]),

  // 44. TRENS, METRÔ & DUAS RODAS
  ...createWordsForTheme('trens_trilhos', [
    { id: 'w_trem', text: 'Locomotiva', accepted: ['trem', 'trem de ferro'], hint: 'Puxa vagões sobre trilhos de ferro soltando fumaça pela chaminé' },
    { id: 'w_bicicleta', text: 'Bicicleta', accepted: ['bike'], hint: 'Veículo de duas rodas movido a pedaladas e guidão' },
    { id: 'w_teleferico', text: 'Teleférico', difficulty: 'medium', accepted: ['teleferico', 'bondinho'], hint: 'Cabine suspensa em cabos de aço que sobe montanhas' },
    { id: 'w_motocicleta', text: 'Motocicleta', accepted: ['moto'], hint: 'Veículo motorizado de duas rodas pilotado usando capacete' },
    { id: 'w_patinete', text: 'Patinete', hint: 'Prancha estreita com duas rodinhas e guidão alto empurrada com o pé' },
  ]),

  // 45. ESPAÇO & ASTRONOMIA
  ...createWordsForTheme('espaco_astronomia', [
    { id: 'w_foguete', text: 'Foguete Espacial', accepted: ['foguete', 'onibus espacial'], hint: 'Veículo alto que decola com labaredas de fogo rumo ao espaço' },
    { id: 'w_saturno', text: 'Saturno', hint: 'Planeta gigante famoso pelos seus grandes anéis ao redor' },
    { id: 'w_estacao_espacial', text: 'Estação Espacial', difficulty: 'medium', accepted: ['estacao espacial'], hint: 'Estrutura em órbita da Terra onde vivem os astronautas' },
    { id: 'w_cometa', text: 'Cometa', accepted: ['estrela cadente', 'meteoro'], hint: 'Corpo celeste que cruza o espaço deixando uma longa cauda luminosa' },
    { id: 'w_eclipse', text: 'Eclipse Solar', accepted: ['eclipse'], hint: 'Fenômeno em que a Lua passa na frente do Sol escurecendo o dia' },
  ]),

  // 46. MONUMENTOS DO MUNDO
  ...createWordsForTheme('lugares', [
    { id: 'w_piramide', text: 'Pirâmide', accepted: ['piramide', 'piramides do egito'], hint: 'Monumento triangular gigante de pedra no deserto do Egito' },
    { id: 'w_torre_eiffel', text: 'Torre Eiffel', accepted: ['torre de paris'], hint: 'Famosa torre metálica pontiaguda localizada em Paris' },
    { id: 'w_estatua_liberdade', text: 'Estátua da Liberdade', accepted: ['estatua da liberdade'], hint: 'Monumento em Nova York que segura uma tocha erguida para o céu' },
    { id: 'w_farol', text: 'Farol Marítimo', accepted: ['farol'], hint: 'Torre alta na costa que gira uma luz forte para guiar navios à noite' },
  ]),

  // 47. ACAMPAMENTO & TRILHA
  ...createWordsForTheme('acampamento_aventura', [
    { id: 'w_bussola', text: 'Bússola', difficulty: 'medium', accepted: ['bussola'], hint: 'Mostrador com agulha magnética que aponta sempre para o Norte' },
    { id: 'w_barraca', text: 'Barraca de Camping', accepted: ['barraca', 'tenda'], hint: 'Abrigo de tecido montado na floresta para dormir no acampamento' },
    { id: 'w_fogueira', text: 'Fogueira', hint: 'Troncos de lenha empilhados no chão com chamas para aquecer a noite' },
    { id: 'w_binoculo', text: 'Binóculos', accepted: ['binoculo'], hint: 'Par de lentes duplas usado nos olhos para enxergar coisas distantes' },
  ]),

  // 48. PRAIA & FÉRIAS DE VERÃO
  ...createWordsForTheme('praia_verao', [
    { id: 'w_oculos_sol', text: 'Óculos de Sol', accepted: ['oculos de sol', 'oculos escuros'], hint: 'Acessório com lentes escuras usado no rosto em dias ensolarados' },
    { id: 'w_castelo_areia', text: 'Castelo de Areia', accepted: ['baldinho de praia'], hint: 'Construção com torrezinhas feita na beira do mar com pá e baldinho' },
    { id: 'w_concha', text: 'Concha do Mar', accepted: ['concha'], hint: 'Estrutura calcária bonita encontrada na areia da praia' },
    { id: 'w_cadeira_praia', text: 'Guarda-Sol', accepted: ['guarda sol'], hint: 'Grande sombrinha colorida fincada na areia da praia' },
  ]),

  // 49. INVERNO & MONTANHA NEVADA
  ...createWordsForTheme('inverno_neve', [
    { id: 'w_iglu', text: 'Iglu', accepted: ['casa de gelo'], hint: 'Casa redonda em forma de cúpula feita com blocos de neve' },
    { id: 'w_boneco_neve', text: 'Boneco de Neve', hint: 'Feito com bolas de neve empilhadas, nariz de cenoura e cachecol' },
    { id: 'w_floco_neve', text: 'Floco de Neve', hint: 'Cristal de gelo microscópico e simétrico de seis pontas que cai do céu' },
    { id: 'w_lareira', text: 'Lareira', hint: 'Estrutura de tijolos na sala onde queima fogo para aquecer a casa' },
  ]),

  // 50. VIDA NA CIDADE
  ...createWordsForTheme('cidade_urbano', [
    { id: 'w_ponte_estaiada', text: 'Ponte Estaiada', accepted: ['ponte', 'viaduto'], hint: 'Estrutura suspensa por cabos e pilares para atravessar carros sobre um rio' },
    { id: 'w_hidrante', text: 'Hidrante', hint: 'Pequeno poste vermelho na calçada onde os bombeiros conectam a mangueira' },
    { id: 'w_chafariz', text: 'Chafariz', accepted: ['fonte de agua', 'fonte'], hint: 'Monumento no meio da praça que jorra jatos de água para o alto' },
    { id: 'w_arranha_ceu', text: 'Arranha-Céu', accepted: ['predio', 'edificio'], hint: 'Prédio urbano altíssimo cheio de andares espelhados' },
  ]),

  // 51. ESPORTES COM BOLA
  ...createWordsForTheme('esportes', [
    { id: 'w_basquete', text: 'Cesta de Basquete', accepted: ['basquete', 'basquetebol'], hint: 'Arremessar a bola laranja no aro com rede' },
    { id: 'w_boliche', text: 'Boliche', hint: 'Lançar uma bola pesada na pista para derrubar dez pinos brancos' },
    { id: 'w_tenis_mesa', text: 'Tênis de Mesa', accepted: ['ping pong', 'pingue pongue', 'tenis de mesa'], hint: 'Esporte com raquetes pequenas e bolinha leve sobre mesa com rede' },
    { id: 'w_futebol', text: 'Trave de Futebol', accepted: ['futebol', 'gol', 'bola de futebol'], hint: 'Chutar a bola no gramado para balançar a rede do goleiro' },
    { id: 'w_sinuca', text: 'Mesa de Sinuca', accepted: ['sinuca', 'bilhar'], hint: 'Mesa verde onde se usa um taco comprido para encaçapar bolas coloridas' },
  ]),

  // 52. ESPORTES RADICAIS & LUTAS
  ...createWordsForTheme('esportes_radicais', [
    { id: 'w_arquearia', text: 'Tiro com Arco', accepted: ['arco e flecha', 'arquearia'], hint: 'Esporte de mira com arco, flecha e alvo circular colorido' },
    { id: 'w_surfe', text: 'Prancha de Surfe', accepted: ['surfe', 'surf', 'prancha'], hint: 'Deslizar sobre as ondas do mar em cima de uma prancha' },
    { id: 'w_esgrima', text: 'Esgrima', difficulty: 'medium', hint: 'Duelo olímpico com roupa branca, máscara e espada florete' },
    { id: 'w_skate', text: 'Skate', accepted: ['skatista'], hint: 'Prancha de madeira com quatro rodinhas para manobras' },
    { id: 'w_luva_boxe', text: 'Luva de Boxe', accepted: ['boxe'], hint: 'Luva acolchoada vermelha usada pelos lutadores no ringue' },
  ]),

  // 53. VIDEOGAMES & GEEK
  ...createWordsForTheme('jogos', [
    { id: 'w_joystick', text: 'Controle de Videogame', accepted: ['controle', 'joystick', 'gamepad', 'manete'], hint: 'Acessório com botões e analógicos usado para jogar videogame' },
    { id: 'w_fliperama', text: 'Fliperama', accepted: ['arcade', 'maquina de arcade'], hint: 'Gabinete clássico de jogos eletrônicos com tela, alavanca e fichas' },
    { id: 'w_oculos_vr', text: 'Óculos VR', accepted: ['oculos vr', 'realidade virtual'], hint: 'Visor colocado no rosto para imersão em jogos 3D' },
    { id: 'w_pocao_vida', text: 'Poção Mágica', accepted: ['pocao', 'frasco de pocao'], hint: 'Frasco de vidro arredondado cheio de líquido brilhante nos jogos' },
  ]),

  // 54. JOGOS DE MESA & BRINQUEDOS
  ...createWordsForTheme('jogos_tabuleiro', [
    { id: 'w_xadrez', text: 'Xadrez', accepted: ['tabuleiro de xadrez'], hint: 'Jogo de tabuleiro quadriculado com Rei, Rainha, Cavalo e Torre' },
    { id: 'w_cubo_magico', text: 'Cubo Mágico', accepted: ['cubo magico', 'rubik'], hint: 'Quebra-cabeça tridimensional com faces coloridas que giram' },
    { id: 'w_pipa', text: 'Pipa', accepted: ['papagaio', 'arraia'], hint: 'Brinquedo de papel colorido que voa alto preso a uma linha com rabiola' },
    { id: 'w_domino', text: 'Dominó', accepted: ['domino'], hint: 'Jogo de peças retangulares com bolinhas numeradas de zero a seis' },
    { id: 'w_ioio', text: 'Ioiô', accepted: ['ioio', 'piao'], hint: 'Brinquedo redondo que sobe e desce enrolado num barbante no dedo' },
  ]),

  // 55. PARQUE DE DIVERSÕES & CIRCO
  ...createWordsForTheme('festa_diversao', [
    { id: 'w_roda_gigante', text: 'Roda-Gigante', accepted: ['roda gigante'], hint: 'Atração circular altíssima com cabines que giram devagar no parque' },
    { id: 'w_montanha_russa', text: 'Montanha-Russa', accepted: ['montanha russa'], hint: 'Trilhos altos com loopings e carrinhos em alta velocidade no parque' },
    { id: 'w_algodao_doce', text: 'Algodão-Doce', accepted: ['algodao doce'], hint: 'Nuvem macia de açúcar colorido enrolada num palito' },
    { id: 'w_carrossel', text: 'Carrossel', hint: 'Brinquedo giratório de parque com cavalinhos coloridos' },
    { id: 'w_tenda_circo', text: 'Tenda de Circo', accepted: ['circo'], hint: 'Grande lona listrada de vermelho e branco com bandeirinha no topo' },
  ]),

  // 56. INSTRUMENTOS MUSICAIS
  ...createWordsForTheme('musica', [
    { id: 'w_violao', text: 'Violão', accepted: ['violao', 'guitarra'], hint: 'Instrumento acústico de madeira com seis cordas' },
    { id: 'w_bateria', text: 'Bateria Musical', accepted: ['bateria'], hint: 'Conjunto de tambores e pratos tocado com duas baquetas' },
    { id: 'w_piano', text: 'Piano de Cauda', accepted: ['piano', 'teclado musical'], hint: 'Instrumento clássico com dezenas de teclas brancas e pretas' },
    { id: 'w_saxofone', text: 'Saxofone', accepted: ['sax'], hint: 'Instrumento de sopro dourado e curvado muito usado no jazz' },
    { id: 'w_sanfona', text: 'Sanfona', accepted: ['acordeao', 'acordeão', 'gaita'], hint: 'Instrumento com fole no meio que abre e fecha tocando forró' },
  ]),

  // 57. SHOW, DJ & ESTÚDIO
  ...createWordsForTheme('palco_show', [
    { id: 'w_microfone', text: 'Microfone', hint: 'Aparelho segurado pelo cantor no palco para amplificar a voz' },
    { id: 'w_fone_ouvido', text: 'Fone de Ouvido', accepted: ['headphone', 'headset'], hint: 'Arco colocado na cabeça sobre as orelhas para escutar música' },
    { id: 'w_disco_vinil', text: 'Disco de Vinil', accepted: ['vinil', 'vitrola'], hint: 'Disco preto grande que gira sob uma agulha para tocar música' },
    { id: 'w_caixa_som', text: 'Caixa de Som', accepted: ['alto falante'], hint: 'Equipamento com cones redondos que vibram espalhando música alta' },
  ]),

  // 58. CINEMA & HOLLYWOOD
  ...createWordsForTheme('filmes_series', [
    { id: 'w_claquete', text: 'Claquete', hint: 'Placa preta e branca batida pelos diretores no início de uma cena' },
    { id: 'w_oscar', text: 'Troféu do Oscar', accepted: ['oscar', 'estatueta do oscar'], hint: 'Estatueta dourada famosa entregue aos melhores filmes' },
    { id: 'w_oculos_3d', text: 'Óculos 3D', accepted: ['oculos 3d'], hint: 'Óculos de cinema com uma lente vermelha e outra azul' },
    { id: 'w_rolo_filme', text: 'Rolo de Filme', accepted: ['pelicula', 'projetor'], hint: 'Carretel circular com fita de cinema cheia de fotogramas' },
  ]),

  // 59. ARTE, DESENHO & ESCULTURA
  ...createWordsForTheme('arte_pintura', [
    { id: 'w_paleta_tinta', text: 'Paleta de Pintor', accepted: ['paleta', 'paleta de cores', 'pincel'], hint: 'Prancha de madeira com furo para o dedo onde o artista mistura tintas' },
    { id: 'w_cavalete', text: 'Tela no Cavalete', accepted: ['cavalete', 'quadro'], hint: 'Tripé de madeira que segura a tela branca para o pintor' },
    { id: 'w_origami', text: 'Origami', accepted: ['dobradura', 'barquinho de papel'], hint: 'Arte japonesa de dobrar papel formando pássaros ou barquinhos' },
  ]),

  // 60. FOTOGRAFIA & COMUNICAÇÃO
  ...createWordsForTheme('fotografia_midia', [
    { id: 'w_camera_foto', text: 'Câmera Fotográfica', accepted: ['camera', 'maquina fotografica'], hint: 'Aparelho com lente redonda e flash usado para tirar fotos' },
    { id: 'w_megafone', text: 'Megafone', hint: 'Cone com alça e gatilho usado para falar muito alto para multidões' },
    { id: 'w_carta_correio', text: 'Envelope de Carta', accepted: ['carta', 'envelope'], hint: 'Papel dobrado com selo no canto enviado pelo correio' },
  ]),

  // 61. CRIATURAS MÍTICAS & MAGIA
  ...createWordsForTheme('fantasia', [
    { id: 'w_dragao', text: 'Dragão', accepted: ['dragao'], hint: 'Criatura alada com escamas que cospe fogo e guarda tesouros' },
    { id: 'w_sereia', text: 'Sereia', hint: 'Ser mitológico marinho metade mulher e metade cauda de peixe' },
    { id: 'w_unicornio', text: 'Unicórnio', accepted: ['unicornio'], hint: 'Cavalo mágico branco com um chifre espiralado na testa' },
    { id: 'w_fenix', text: 'Fênix', difficulty: 'medium', accepted: ['fenix', 'passaro de fogo'], hint: 'Pássaro lendário de fogo que renasce das próprias cinzas' },
    { id: 'w_genio', text: 'Gênio da Lâmpada', accepted: ['genio', 'lampada magica'], hint: 'Ser mágico que sai de uma lâmpada dourada para realizar três desejos' },
  ]),

  // 62. MUNDO MEDIEVAL & CASTELOS
  ...createWordsForTheme('medieval_castelo', [
    { id: 'w_castelo', text: 'Castelo Medieval', accepted: ['castelo', 'fortaleza'], hint: 'Construção medieval com muralhas, ponte levadiça e torres altas' },
    { id: 'w_catapulta', text: 'Catapulta', hint: 'Máquina de guerra de madeira usada para lançar pedras em muralhas' },
    { id: 'w_armadura', text: 'Armadura Medieval', accepted: ['armadura', 'cavaleiro'], hint: 'Traje completo de placas de aço com elmo usado por cavaleiros' },
    { id: 'w_espada_pedra', text: 'Espada e Escudo', accepted: ['espada', 'escudo', 'excalibur'], hint: 'Armas clássicas de combate e defesa dos guerreiros medievais' },
  ]),

  // 63. PIRATAS DOS SETE MARES
  ...createWordsForTheme('piratas_mares', [
    { id: 'w_bau_tesouro', text: 'Baú do Tesouro', accepted: ['bau', 'tesouro', 'bau de pirata'], hint: 'Caixa de madeira trancada cheia de moedas de ouro e joias' },
    { id: 'w_navio_pirata', text: 'Navio Pirata', accepted: ['caravela', 'barco pirata'], hint: 'Embarcação antiga com canhões e bandeira de caveira no mastro' },
    { id: 'w_mapa_tesouro', text: 'Mapa do Tesouro', accepted: ['mapa'], hint: 'Pergaminho antigo com caminho pontilhado até um grande X vermelho' },
    { id: 'w_luneta', text: 'Luneta Pirata', accepted: ['luneta'], hint: 'Pequeno tubo retrátil que o capitão usa num olho só para ver terras' },
  ]),

  // 64. VELHO OESTE & COWBOYS
  ...createWordsForTheme('velho_oeste', [
    { id: 'w_ferradura', text: 'Ferradura', hint: 'Peça metálica em formato de U colocada no casco do cavalo' },
    { id: 'w_estrela_xerife', text: 'Estrela de Xerife', accepted: ['xerife', 'distintivo'], hint: 'Distintivo dourado de pontas usado no peito pela lei no velho oeste' },
    { id: 'w_carroca', text: 'Carroça', accepted: ['carroca', 'charrete'], hint: 'Veículo de madeira com rodas grandes puxado por cavalos' },
  ]),

  // 65. EGITO ANTIGO & ARQUEOLOGIA
  ...createWordsForTheme('egito_antigo', [
    { id: 'w_mumia', text: 'Múmia', accepted: ['mumia', 'sarcofago'], hint: 'Figura do Egito Antigo toda enrolada em faixas brancas' },
    { id: 'w_camelo', text: 'Camelo', accepted: ['dromedario'], hint: 'Animal do deserto que possui corcovas nas costas e aguenta muito calor' },
    { id: 'w_farao', text: 'Máscara de Faraó', accepted: ['farao', 'esfinge'], hint: 'Governante do Egito Antigo com touca listrada de ouro e azul' },
  ]),

  // 66. MITOLOGIA GREGA & VIKINGS
  ...createWordsForTheme('mitologia_viking', [
    { id: 'w_cavalo_troia', text: 'Cavalo de Troia', difficulty: 'medium', accepted: ['cavalo de madeira'], hint: 'Cavalo gigante de madeira usado pelos gregos para entrar na muralha' },
    { id: 'w_viking', text: 'Capacete Viking', accepted: ['viking', 'guerreiro viking'], hint: 'Guerreiro nórdico dos mares retratado com elmo e barco drakar' },
    { id: 'w_tridente', text: 'Tridente de Poseidon', accepted: ['tridente'], hint: 'Lança dourada de três pontas usada pelo deus dos mares' },
    { id: 'w_martelo_thor', text: 'Martelo de Thor', accepted: ['mjolnir', 'martelo'], hint: 'Arma nórdica lendária que invoca trovões e relâmpagos' },
  ]),

  // 67. MISTÉRIO & HALLOWEEN
  ...createWordsForTheme('terror_halloween', [
    { id: 'w_abobora_halloween', text: 'Abóbora de Halloween', accepted: ['abobora', 'dia das bruxas'], hint: 'Legume laranja esculpido com olhos e sorriso iluminado por vela' },
    { id: 'w_fantasma', text: 'Fantasma', hint: 'Assombração clássica flutuante parecida com um lençol branco' },
    { id: 'w_teia_aranha', text: 'Teia de Aranha', accepted: ['aranha', 'teia'], hint: 'Fios geométricos tecidos nos cantos escuros para capturar insetos' },
    { id: 'w_caldeirao', text: 'Caldeirão de Bruxa', accepted: ['caldeirao', 'vassoura de bruxa'], hint: 'Panela preta redonda de ferro borbulhando sobre o fogo' },
  ]),

  // 68. DETETIVE & ESPIONAGEM
  ...createWordsForTheme('espionagem_detetive', [
    { id: 'w_detetive', text: 'Lupa de Detetive', accepted: ['lupa', 'detetive'], hint: 'Lente redonda com cabo usada para ampliar pistas e pegadas' },
    { id: 'w_cofre', text: 'Cofre Forte', accepted: ['cofre'], hint: 'Caixa blindada de aço com volante giratório para guardar valores' },
    { id: 'w_pegadas', text: 'Pegadas de Sapato', accepted: ['pegada', 'pegadas', 'pista'], hint: 'Marcas deixadas no chão por quem caminhou pelo local' },
  ]),

  // 69. FICÇÃO CIENTÍFICA & OVNIs
  ...createWordsForTheme('alienigenas_scifi', [
    { id: 'w_discovoador', text: 'Disco Voador', accepted: ['ovni', 'nave espacial'], hint: 'Nave alienígena redonda com cúpula e feixe de luz abduzindo' },
    { id: 'w_sabre_luz', text: 'Sabre de Luz', accepted: ['espada laser', 'lightsaber'], hint: 'Espada brilhante de energia usada pelos guerreiros no espaço' },
    { id: 'w_alienigena', text: 'Alienígena', accepted: ['extraterrestre', 'et', 'alien'], hint: 'Ser de outro planeta de cabeça grande e olhos pretos amendoados' },
  ]),

  // 70. CULTURA & SÍMBOLOS DO BRASIL
  ...createWordsForTheme('brasil', [
    { id: 'w_cristo_redentor', text: 'Cristo Redentor', accepted: ['cristo', 'corcovado'], hint: 'Estátua gigante de braços abertos no topo do morro no Rio de Janeiro' },
    { id: 'w_capivara', text: 'Capivara', hint: 'Maior roedor do mundo, muito simpático e comum perto de lagoas no Brasil' },
    { id: 'w_tucano', text: 'Tucano', hint: 'Ave tropical brasileira famosa pelo grande bico colorido laranja' },
    { id: 'w_pao_de_queijo', text: 'Pão de Queijo', accepted: ['pao de queijo'], hint: 'Bolinha assada mineira deliciosa feita com polvilho e queijo' },
    { id: 'w_chimarrao', text: 'Chimarrão', accepted: ['chimarrao', 'cuia', 'terere'], hint: 'Bebida tradicional do sul servida numa cuia com bomba metálica' },
  ]),

  // 71. PROFISSÕES & CARREIRAS
  ...createWordsForTheme('profissoes', [
    { id: 'w_astronauta', text: 'Astronauta', accepted: ['cosmonauta'], hint: 'Viaja em foguetes usando traje espacial e capacete com viseira' },
    { id: 'w_bombeiro', text: 'Bombeiro', accepted: ['bombeira'], hint: 'Combate incêndios com mangueira e caminhão vermelho' },
    { id: 'w_cozinheiro', text: 'Chef de Cozinha', accepted: ['cozinheiro', 'chef', 'mestre cuca'], hint: 'Prepara pratos usando chapéu branco alto e colher de pau' },
    { id: 'w_maestro', text: 'Maestro', difficulty: 'medium', accepted: ['regente'], hint: 'Rege uma orquestra usando uma batuta' },
  ]),

  // 72. LABORATÓRIO & QUÍMICA
  ...createWordsForTheme('ciencia', [
    { id: 'w_microscopio', text: 'Microscópio', difficulty: 'medium', accepted: ['microscopio'], hint: 'Aparelho óptico de laboratório que amplia células e bactérias' },
    { id: 'w_telescopio', text: 'Telescópio', accepted: ['telescopio'], hint: 'Tubo com lentes apontado para o céu para ver estrelas e planetas' },
    { id: 'w_dna', text: 'Molécula de DNA', difficulty: 'medium', accepted: ['dna', 'helice dupla'], hint: 'Estrutura genética desenhada como uma escada torcida em dupla hélice' },
    { id: 'w_ima', text: 'Ímã', accepted: ['ima', 'iman', 'magneto'], hint: 'Objeto em formato de ferradura vermelha e azul que atrai metais' },
    { id: 'w_atomo', text: 'Átomo', accepted: ['atomo'], hint: 'Núcleo central cercado por anéis elípticos com elétrons girando' },
  ]),

  // 73. CORPO HUMANO & ANATOMIA
  ...createWordsForTheme('corpo_humano', [
    { id: 'w_coracao', text: 'Coração', accepted: ['coracao'], hint: 'Órgão que bate no peito e bombeia sangue pelo corpo' },
    { id: 'w_cerebro', text: 'Cérebro', accepted: ['cerebro'], hint: 'Órgão dentro do crânio responsável pelos pensamentos e memória' },
    { id: 'w_esqueleto', text: 'Esqueleto', accepted: ['caveira', 'ossos'], hint: 'Conjunto de ossos e costelas que sustenta o corpo humano' },
    { id: 'w_dente', text: 'Dente Molar', accepted: ['dente', 'dentes'], hint: 'Estrutura branca da boca cuidada pelo dentista' },
  ]),

  // 74. HOSPITAL & MEDICINA
  ...createWordsForTheme('hospital_medicina', [
    { id: 'w_estetoscopio', text: 'Estetoscópio', difficulty: 'medium', accepted: ['estetoscopio'], hint: 'Instrumento que o médico coloca no ouvido para escutar o peito' },
    { id: 'w_termometro', text: 'Termômetro', accepted: ['termometro'], hint: 'Instrumento colocado debaixo do braço para medir febre' },
    { id: 'w_curativo', text: 'Curativo Adesivo', accepted: ['band-aid', 'bandaid', 'curativo'], hint: 'Tirinha colada na pele para proteger um pequeno machucado' },
    { id: 'w_seringa', text: 'Seringa de Vacina', accepted: ['seringa', 'vacina', 'injecao'], hint: 'Tubo graduado com êmbolo usado por enfermeiros para aplicar vacinas' },
  ]),

  // 75. ESCOLA & MATERIAL ESCOLAR
  ...createWordsForTheme('escola_estudos', [
    { id: 'w_mochila', text: 'Mochila Escolar', accepted: ['mochila'], hint: 'Bolsa com duas alças carregada nas costas cheia de cadernos' },
    { id: 'w_globo_terrestre', text: 'Globo Terrestre', accepted: ['globo', 'mapa mundi'], hint: 'Esfera giratória com o mapa de todos os continentes e oceanos' },
    { id: 'w_quadro_negro', text: 'Quadro-Negro', accepted: ['quadro negro', 'lousa'], hint: 'Painel na parede da sala de aula onde o professor escreve com giz' },
    { id: 'w_apontador', text: 'Apontador', hint: 'Pequeno objeto com lâmina usado para afiar a ponta do lápis' },
  ]),

  // 76. MATEMÁTICA & GEOMETRIA
  ...createWordsForTheme('matematica_geometria', [
    { id: 'w_calculadora', text: 'Calculadora', hint: 'Aparelho cheio de botões numéricos usado para fazer contas rápidas' },
    { id: 'w_compasso', text: 'Compasso Geométrico', difficulty: 'medium', accepted: ['compasso'], hint: 'Instrumento escolar de duas hastes usado para desenhar círculos perfeitos' },
    { id: 'w_abaco', text: 'Ábaco', difficulty: 'medium', accepted: ['abaco'], hint: 'Antigo instrumento de cálculo feito com varetas e bolinhas deslizantes' },
    { id: 'w_esquadro', text: 'Régua e Esquadro', accepted: ['regua', 'esquadro', 'transferidor'], hint: 'Instrumentos plásticos transparentes com medidas usados em geometria' },
  ]),

  // 77. LIVROS & BIBLIOTECA
  ...createWordsForTheme('literatura_biblioteca', [
    { id: 'w_livro', text: 'Livro Aberto', accepted: ['livro', 'enciclopedia'], hint: 'Conjunto de páginas impressas com capa dura para leitura' },
    { id: 'w_pergaminho', text: 'Pergaminho', accepted: ['rolo de papel', 'papiro'], hint: 'Folha de papel antigo enrolada nas duas pontas com selo de cera' },
    { id: 'w_pena_tinteiro', text: 'Pena e Tinteiro', accepted: ['pena', 'tinteiro'], hint: 'Pluma de ave mergulhada na tinta usada antigamente para escrever' },
  ]),

  // 78. FINANÇAS & COFRE
  ...createWordsForTheme('financas_economia', [
    { id: 'w_porquinho_cofre', text: 'Cofrinho de Porco', accepted: ['cofrinho', 'porquinho'], hint: 'Porquinho de cerâmica com uma fenda nas costas para guardar moedas' },
    { id: 'w_balanca_justica', text: 'Balança de Dois Pratos', accepted: ['balanca'], hint: 'Instrumento clássico que equilibra dois pratos suspensos para comparar pesos' },
    { id: 'w_saco_dinheiro', text: 'Saco de Moedas', accepted: ['dinheiro', 'moedas', 'cifrao'], hint: 'Bolsa de pano amarrada com o símbolo do cifrão estampado' },
  ]),

  // 79. ACADEMIA & VIDA SAUDÁVEL
  ...createWordsForTheme('academia_fitness', [
    { id: 'w_halter', text: 'Halter de Academia', accepted: ['halter', 'peso', 'musculacao'], hint: 'Barra curta com pesos nas duas pontas levantada com as mãos' },
    { id: 'w_esteira_acad', text: 'Esteira de Corrida', accepted: ['esteira'], hint: 'Aparelho de academia onde você corre sem sair do lugar' },
    { id: 'w_corda_pular', text: 'Corda de Pular', accepted: ['pular corda'], hint: 'Cabo com dois pegadores girado sobre a cabeça e sob os pés' },
  ]),

  // 80. FESTAS & TRADIÇÕES
  ...createWordsForTheme('festas_populares', [
    { id: 'w_arvore_natal', text: 'Árvore de Natal', accepted: ['arvore de natal', 'pinheiro de natal'], hint: 'Pinheiro enfeitado com bolinhas coloridas, pisca-pisca e estrela no topo' },
    { id: 'w_balao_saojoao', text: 'Festa Junina', accepted: ['bandeirinhas', 'fogueira de sao joao'], hint: 'Comemoração tradicional com bandeirinhas coloridas, chapéu de palha e fogueira' },
    { id: 'w_fogos_artificio', text: 'Fogos de Artifício', accepted: ['fogos de artificio', 'fogos'], hint: 'Explosões coloridas e brilhantes no céu na noite de Ano-Novo' },
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
