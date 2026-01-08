import * as fs from 'fs';
import * as readline from 'readline';
export async function parseTranscript(transcriptPath) {
    const tools = new Map();
    const agents = new Map();
    let todos = [];
    let sessionStart;
    if (!transcriptPath || !fs.existsSync(transcriptPath)) {
        return { tools: [], agents: [], todos: [] };
    }
    try {
        const fileStream = fs.createReadStream(transcriptPath);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity,
        });
        for await (const line of rl) {
            if (!line.trim())
                continue;
            try {
                const entry = JSON.parse(line);
                processEntry(entry, tools, agents, todos, (t) => (todos = t), (d) => { if (!sessionStart)
                    sessionStart = d; });
            }
            catch {
                // Skip malformed JSON lines
            }
        }
    }
    catch {
        // Return partial results on error
    }
    return {
        tools: Array.from(tools.values()).slice(-20),
        agents: Array.from(agents.values()).slice(-10),
        todos,
        sessionStart,
    };
}
function processEntry(entry, tools, agents, _todos, setTodos, setSessionStart) {
    if (entry.timestamp) {
        setSessionStart(new Date(entry.timestamp));
    }
    const content = entry.message?.content;
    if (!Array.isArray(content))
        return;
    for (const block of content) {
        if (block.type === 'tool_use' && block.id && block.name) {
            if (block.name === 'Task') {
                // Task tool = agent
                const input = block.input;
                agents.set(block.id, {
                    id: block.id,
                    type: input?.subagent_type || 'unknown',
                    description: input?.description,
                    model: input?.model,
                    status: 'running',
                    startTime: Date.now(),
                });
            }
            else if (block.name === 'TodoWrite') {
                // TodoWrite updates todos
                const input = block.input;
                if (input?.todos) {
                    setTodos(input.todos);
                }
            }
            else {
                // Regular tool
                tools.set(block.id, {
                    id: block.id,
                    name: block.name,
                    status: 'running',
                    target: extractTarget(block.name, block.input),
                    startTime: Date.now(),
                });
            }
        }
        else if (block.type === 'tool_result' && block.tool_use_id) {
            const tool = tools.get(block.tool_use_id);
            if (tool) {
                tool.status = block.is_error ? 'error' : 'completed';
                tool.endTime = Date.now();
            }
            const agent = agents.get(block.tool_use_id);
            if (agent) {
                agent.status = 'completed';
                agent.endTime = Date.now();
            }
        }
    }
}
function extractTarget(toolName, input) {
    if (!input)
        return undefined;
    switch (toolName) {
        case 'Read':
        case 'Write':
        case 'Edit':
            return input.file_path;
        case 'Glob':
            return input.pattern;
        case 'Grep':
            return input.pattern;
        case 'Bash':
            return input.command;
        default:
            return undefined;
    }
}
//# sourceMappingURL=transcript.js.map