export type SessionUpdate = {
    type: 'reasoning',
    text: string
} | {
    type: 'text',
    text: string
} | {
    type: 'tool_call',
    id: string,
    name: string,
    arguments: any
} | {
    type: 'error',
    message: string
} | {
    type: 'ended'
}