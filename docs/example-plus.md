# Prompt Plus

Esta skill orienta a criacao de prompts eficazes para uso com LLMs, evitando respostas genericas, confusas ou inconsistentes. O foco e em clareza, estrutura e intencao, para que o modelo entenda exatamente o que voce quer.

## Antes de Escrever o Prompt

Responda estas perguntas antes de comecar:

- **O que voce quer?** Qual e a tarefa principal?
- **Quem e o modelo?** GPT-4, Claude, Gemini? Cada um reage diferente.
- **Como deve ser a resposta?** Lista, texto corrido, tabela, JSON, codigo?
- **Qual tom?** Formal, direto, didatico, critico?
- **O que ele NAO deve fazer?** Restricoes sao tao importantes quanto instrucoes.

## Tecnicas Principais

| Tecnica | Quando Usar | O que Melhora |
|---|---|---|
| Zero-shot | Tarefa simples e clara | Velocidade, sem exemplos |
| Few-shot | Quando o formato importa | Padrao e consistencia da saida |
| Chain-of-Thought | Raciocinio, logica, calculos | Acuracia em passos complexos |
| Role Prompting | Quando especialidade importa | Ancora o modelo em conhecimento especifico |
| Structured Output | Integracao com sistemas | Saida parseavel e previsivel |

## Estrutura de um Bom Prompt

### Bloco 1 — Contexto e Papel

```
Voce e um revisor de textos especializado em comunicacao corporativa.
Seu objetivo e corrigir clareza, tom e estrutura de emails profissionais.
Responda sempre em portugues brasileiro, de forma direta.
```

### Bloco 2 — Instrucao Principal

```
Revise o email abaixo e entregue:
1. Versao corrigida do texto
2. Lista dos principais problemas encontrados
3. Justificativa breve para cada correcao
```

### Bloco 3 — Exemplo de Referencia (Few-shot)

```markdown
Entrada de exemplo:
"""
Oi, precisamos que vc entregue o relatorio o mais rapido possivel ok?
"""

Saida esperada:
**Versao corrigida:**
Prezado(a), solicito gentilmente a entrega do relatorio assim que possivel.

**Problemas encontrados:**
- Tom informal inadequado para contexto corporativo
- Abreviacao "vc" nao recomendada em comunicacao profissional
```

### Bloco 4 — Formato de Saida

```json
{
  "texto_corrigido": "Versao revisada aqui",
  "problemas": [
    {
      "trecho_original": "vc",
      "correcao": "voce",
      "motivo": "abreviacao informal"
    }
  ]
}
```

### Bloco 5 — Restricoes

```
NAO invente informacoes que nao estejam no texto original.
NAO altere o significado da mensagem, apenas o tom e a estrutura.
Se o texto estiver vazio, retorne exatamente: {"erro": "input invalido"}.
```

## Propriedades do Prompt

| Campo | Tipo | Obrigatorio | Descricao |
|---|---|---|---|
| `name` | string | Sim | Nome do prompt |
| `version` | string | Sim | Versao (ex: `1.0.0`) |
| `model_target` | string | Sim | Modelo para o qual foi feito |
| `output_format` | string | Sim | Formato esperado da resposta |
| `temperature` | float | Nao | Entre 0.0 (preciso) e 1.0 (criativo) |
| `guardrails` | array | Nao | Lista de restricoes explicitas |
| `created_at` | Date | Sim | Data de criacao |

## Checklist Antes de Usar

**Clareza:**
- [ ] O objetivo esta na primeira linha
- [ ] Nao ha instrucoes contraditoras
- [ ] O tom esperado esta definido

**Formato:**
- [ ] O formato de saida esta especificado
- [ ] Exemplos foram incluidos se o padrao importa

**Restricoes:**
- [ ] Casos de borda foram antecipados
- [ ] O que o modelo nao deve fazer esta claro

## Quando Algo Nao Funcionar

**Desvio Pequeno**

```
1. Ajuste a instrucao principal
2. Adicione um exemplo mais especifico
3. Teste novamente
```

**Desvio Grande**

```
1. Volte ao Bloco 1 e redefina o contexto
2. Troque a tecnica de prompting
3. Reconstrua o prompt do zero
```
