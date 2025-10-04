export type SessionUpdate = {
    type: 'reasoning',
    text: string
} | {
    type: 'text',
    text: string
} | {
    type: 'tool_call',
    name: string,
    arguments: string
} | {
    type: 'ended'
}