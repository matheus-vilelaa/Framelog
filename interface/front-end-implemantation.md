# Relatório de Arquitetura de Sistemas Híbridos de Alto Desempenho: Integração de Interface Electron Sob Demanda com Backend Nativo em C++


1. Visão Executiva e Paradigma Arquitetural

A engenharia de software desktop moderna enfrenta um dilema persistente: a necessidade de interfaces de usuário (UI) ricas, responsivas e de rápido desenvolvimento, contrastada com a exigência rigorosa de eficiência de recursos, acesso de baixo nível ao sistema operacional e segurança de dados. A solicitação para desenvolver uma aplicação multiplataforma (Windows e Linux) que utilize Electron para a interface gráfica sob demanda e C++ para o processamento pesado (backend) representa uma resposta sofisticada a esse dilema. Este relatório analisa exaustivamente a viabilidade, os padrões de implementação e as estratégias de otimização para tal arquitetura, focando especificamente nas funcionalidades críticas de captura de tela, Processamento de Imagens, Criptografia de Dados (SQLCipher/BIP39) e Gerenciamento de Listas Negras (Blacklists).
A premissa central de "UI sob Demanda" inverte o modelo tradicional de aplicações Electron. Em vez de o runtime do Node.js e o renderizador Chromium serem os processos primários que consomem memória indiscriminadamente desde a inicialização, propõe-se que um executável C++ leve e nativo atue como o orquestrador do ciclo de vida da aplicação.1 Este daemon nativo gerencia a persistência, os ganchos do sistema (hooks), o monitoramento de atividade e a criptografia, invocando a camada de apresentação Electron apenas quando a interação humana é estritamente necessária.

1.1 Justificativa Técnica para a Abordagem Híbrida

A escolha de C++ para o backend garante controle granular sobre a alocação de memória e o uso da CPU, essencial para tarefas de alta frequência como o monitoramento de janelas ativas e processamento de OCR (Reconhecimento Óptico de Caracteres). O Electron, embora notoriamente intensivo em recursos, oferece a melhor velocidade de iteração para interfaces complexas. Ao desacoplar esses componentes, o sistema atinge um perfil de consumo de memória em repouso drásticamente reduzido (frequentemente abaixo de 10-20 MB para o daemon C++), expandindo-se apenas temporariamente durante a configuração ou visualização de dados pelo usuário.3


2. Arquitetura de Processos Desacoplados e Comunicação Interprocessos (IPC)

O sucesso desta arquitetura depende inteiramente da eficiência da ponte de comunicação entre o backend C++ e o frontend Electron. Diferentemente de aplicações monolíticas onde a comunicação ocorre em memória, aqui temos limites de processo distintos que exigem mecanismos de IPC (Inter-Process Communication) robustos.

2.1 Estratégia de Gerenciamento do Ciclo de Vida "UI Sob Demanda"

O backend C++ deve ser configurado para iniciar com o sistema operacional (via Registro do Windows ou Systemd/XDG Autostart no Linux). Ele opera em um loop de eventos nativo, invisível ou representado apenas por um ícone na bandeja do sistema (System Tray).
Quando o usuário interage com o ícone da bandeja ou aciona uma tecla de atalho global, o backend verifica se o processo Electron já está em execução:
Inicialização Fria (Cold Start): Se nenhum processo Electron estiver ativo, o C++ utiliza CreateProcess (Windows) ou fork/exec (Linux) para lançar o executável Electron, passando parâmetros de conexão (como o nome do Pipe IPC e tokens de autenticação) via argumentos de linha de comando ou variáveis de ambiente.4
Sinalização (Warm Start): Se o Electron estiver em execução mas oculto, o backend envia um sinal IPC para que a janela seja restaurada e trazida para o primeiro plano.
Encerramento Econômico: Após um período de inatividade ou comando explícito de "minimizar para a bandeja", o backend pode enviar um comando para o Electron encerrar seu processo de renderização, liberando centenas de megabytes de RAM, mantendo apenas o daemon C++ ativo.3

2.2 Protocolos de IPC de Alta Performance

A transmissão de dados, especialmente buffers de imagem para captura de tela, não pode depender da saída padrão (stdio) ou de protocolos baseados em texto como JSON puro, que introduzem latência de serialização e overhead de CPU significativos.

2.2.1 Named Pipes e Unix Domain Sockets

A solução recomendada é o uso de Named Pipes no Windows e Unix Domain Sockets no Linux. Ambos fornecem um canal de comunicação bidirecional confiável e orientado a stream, comportando-se de maneira semelhante a sockets de rede, mas operando inteiramente na memória do kernel, sem a sobrecarga da pilha TCP/IP.6
Implementação Windows: O backend C++ cria um pipe nomeado (\\.\pipe\app-ipc-session-id) usando CreateNamedPipe. Este pipe suporta modos de mensagem ou byte stream. Para imagens, o modo byte stream é preferível. O Electron conecta-se a este pipe usando o módulo net do Node.js (net.connect('\\\\.\\pipe\\app-ipc-session-id')).
Implementação Linux: O backend cria um arquivo de socket (e.g., /run/user/1000/app-ipc.sock). O Node.js conecta-se a este caminho de arquivo. É crucial definir as permissões corretas (chmod 600) para garantir que apenas o usuário proprietário possa conectar-se ao socket.4

2.2.2 Serialização de Dados: Protocol Buffers vs. FlatBuffers

Para garantir a integridade dos dados transmitidos (comandos de blacklist, metadados de captura), recomenda-se o uso de esquemas de serialização binária. Embora JSON seja fácil para prototipagem, bibliotecas como FlatBuffers ou MessagePack são superiores para desempenho.
FlatBuffers: Permite o acesso a dados serializados sem fazer o parsing/desempacotamento de todo o objeto, o que é ideal para verificar rapidamente o cabeçalho de uma mensagem em C++ antes de decidir processar o corpo da mensagem.1
MessagePack: Uma alternativa mais simples que oferece compactação binária eficiente e é suportada nativamente por muitas bibliotecas C++ e Node.js, oferecendo um bom compromisso entre velocidade de implementação e performance em tempo de execução.

2.2.3 Transferência de Imagens "Zero-Copy" (Memória Compartilhada)

Para capturas de tela em alta resolução (4K), mesmo pipes podem ser um gargalo. A técnica de Memória Compartilhada (Shared Memory) deve ser empregada.
O backend C++ aloca um bloco de memória (Memory Mapped File) identificado por um nome único.
A imagem capturada (bitmap cru) é copiada diretamente para este bloco.
O C++ envia apenas uma pequena mensagem IPC para o Electron contendo o identificador da memória e as dimensões da imagem.
O Electron (via um módulo nativo Node-API ou ffi-napi) mapeia esse bloco de memória e constrói um Buffer ou Uint8Array que pode ser desenhado diretamente em um Canvas HTML5, eliminando cópias redundantes de dados.1


## Front-end design description

Image 1: Light Mode Interface
This image depicts the Light Mode version of a desktop application dashboard.

Header: There is a top navigation bar with a light background. It features three prominent yellow buttons labeled "Home", "Histórico" (History), and "Configurações" (Settings). There is a search bar labeled "Procurar" and a sun icon on the far right, indicating the current light theme.

Main Content - "Screenshots Recentes" (Recent Screenshots): The upper section displays a grid of cards representing recently captured screen activity.

The cards show specific applications like "Notion" and "Desktop UltraWide."

Each card contains a screenshot and a text description below it (e.g., "A imagem mostra uma página do Notion chamada 'Projeto FrameLog'..."), suggesting the app analyzes and summarizes screen content.

Secondary Content - "Mais Visitados" (Most Visited): The lower section shows a grid of cards labeled "Arc" (likely the browser), displaying repeated captures of a Figma interface.

Footer: A status bar at the bottom provides technical metrics:

Storage: "Espaço ocupado: 2.8/10 Gb" (Space used).

Retention: "Dias ate apagar itens mais antigos: 54 dias" (Days until oldest items are deleted).

Version: "Versão: 0.01".

Aesthetic: The design uses a clean, bright color palette with soft grey backgrounds and high-contrast yellow accents for interactive elements.