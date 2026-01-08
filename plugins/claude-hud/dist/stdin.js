export async function readStdin() {
    if (process.stdin.isTTY) {
        return null;
    }
    const chunks = [];
    for await (const chunk of process.stdin) {
        chunks.push(chunk);
    }
    const input = Buffer.concat(chunks).toString('utf8').trim();
    if (!input) {
        return null;
    }
    try {
        return JSON.parse(input);
    }
    catch {
        return null;
    }
}
export function getContextPercent(stdin) {
    const { context_window, input_tokens, cache_creation_input_tokens, cache_read_input_tokens } = stdin;
    if (!context_window || context_window === 0) {
        return 0;
    }
    const total = (input_tokens || 0) + (cache_creation_input_tokens || 0) + (cache_read_input_tokens || 0);
    return (total / context_window) * 100;
}
export function getModelName(stdin) {
    return stdin.model?.display_name || stdin.model?.id || 'Unknown';
}
//# sourceMappingURL=stdin.js.map