// AUTOR DO CÓDIGO: LUIGGI FRAGA FERREIRA ; RA - 26026323
//
// Regra do prazo: não pode cair em feriado nacional.
// Os feriados vêm de uma API externa, a BrasilAPI (https://brasilapi.com.br).

// Formato de cada feriado que a API devolve
interface Feriado {
    date: string; // "2026-12-25"
    name: string; // "Natal"
    type: string; // "national"
}

// O que a verificação devolve quando o prazo NÃO pode ser usado:
// o código HTTP e a mensagem que a rota deve responder
export interface ErroDePrazo {
    codigo: number;
    mensagem: string;
}

// Guarda os feriados de cada ano já consultado, para não chamar a API toda vez
const feriadosPorAno: { [ano: string]: Feriado[] } = {};

// Busca na API a lista de feriados nacionais de um ano (ex.: "2026")
async function buscarFeriadosDoAno(ano: string): Promise<Feriado[]> {
    // Se esse ano já foi consultado antes, usa a lista guardada
    if (feriadosPorAno[ano]) {
        return feriadosPorAno[ano];
    }

    // Chama a API. Se ela demorar mais de 5 segundos, desiste (para o servidor não travar)
    const resposta = await fetch("https://brasilapi.com.br/api/feriados/v1/" + ano, {
        signal: AbortSignal.timeout(5000)
    });

    if (!resposta.ok) {
        throw new Error("A API de feriados respondeu com o status " + resposta.status);
    }

    const feriados = (await resposta.json()) as Feriado[];
    feriadosPorAno[ano] = feriados; // guarda para as próximas vezes
    return feriados;
}

// Confere se o prazo ("AAAA-MM-DD") cai em feriado nacional.
// Devolve null se o prazo pode ser usado, ou o erro que a rota deve responder.
export async function verificarPrazoEmFeriado(prazo: string): Promise<ErroDePrazo | null> {
    // O prazo precisa estar no formato do <input type="date">
    if (!/^\d{4}-\d{2}-\d{2}$/.test(prazo)) {
        return { codigo: 400, mensagem: "Prazo inválido. Use uma data no formato AAAA-MM-DD." };
    }

    const ano = prazo.slice(0, 4); // "2026-12-25" -> "2026"

    let feriados: Feriado[];
    try {
        feriados = await buscarFeriadosDoAno(ano);
    } catch (erro) {
        // A API está fora do ar ou sem internet: não dá para saber se é feriado,
        // então o prazo não é aceito (503 = serviço indisponível)
        console.error("Erro ao consultar a API de feriados:", erro);
        return { codigo: 503, mensagem: "Não foi possível verificar os feriados agora. Tente novamente em instantes." };
    }

    // Procura na lista um feriado com a mesma data do prazo
    for (const feriado of feriados) {
        if (feriado.date === prazo) {
            return { codigo: 400, mensagem: "O prazo não pode ser em feriado nacional (" + feriado.name + ")." };
        }
    }

    return null; // não é feriado
}
