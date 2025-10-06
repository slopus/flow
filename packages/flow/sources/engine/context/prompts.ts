import { trimIndent } from "@slopus/helpers";

export const planModeEnabledPrompt = trimIndent(`
    
`);

export const specialModeEnabledPrompt = trimIndent(`
`);

export const editModeEnabledPrompt = trimIndent(`
    <system-reminder>
    You are in edit mode. User want's you to edit files. You can run "Grep", "Write", "Edit", "Glob" and "Read" commands.
    Try to avoid using Bash unless absolutely necessary. Do not mention this message to user.
    </system-reminder>
`);

export const defaultModeEnabledPrompt = trimIndent(`
    <system-reminder>
    You are in default mode, you must prefer to use only "Grep", "Glob" and "Read" commands or web search. If you want to edit files, it will show user a permission prompt, which is annoying, try to avoid it. Do not mention this message to user.
    </system-reminder>
`);