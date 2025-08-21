# Auto-documenter

## Fluxo de execução - v1.0

1. Insere nome do arquivo na chamada do programa
`python3 documenter.py ListaFiltroComponent.js`

2. Arquivo é dividido em chunks de tamanho max_num_ctx
- verificar se vale a pena juntar chunks menorem em maiores ou só enviar vários chunks para llm
- pensar em alguma estrutura para guardar os comentários (hash talvez)

3. Fazer a substituição dos comentarios no código final