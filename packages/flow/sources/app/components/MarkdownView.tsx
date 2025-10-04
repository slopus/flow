import { Box, Text } from "ink";
import React from "react";
import { theme } from "../theme.js";

// Note: If this import fails, run: bun add marked
// The marked library is used to parse markdown into tokens
import { marked, Token, Tokens } from "marked";

interface MarkdownViewProps {
    content: string;
}

export const MarkdownView = React.memo((props: MarkdownViewProps) => {
    const tokens = React.useMemo(() => {
        try {
            // Configure marked to handle inline code properly
            marked.setOptions({
                breaks: true,
                gfm: true,
            });
            return marked.lexer(props.content);
        } catch (error) {
            console.error("Failed to parse markdown:", error);
            return [];
        }
    }, [props.content]);

    return (
        <Box flexDirection="column">
            {tokens.map((token, index) => (
                <TokenRenderer
                    key={index}
                    token={token}
                    isLast={index === tokens.length - 1}
                />
            ))}
        </Box>
    );
});

const TokenRenderer: React.FC<{ token: Token; depth?: number; isLast?: boolean }> = ({ token, depth = 0, isLast = false }) => {
    switch (token.type) {
        case "heading":
            return <HeadingRenderer token={token as Tokens.Heading} isLast={isLast} />;
        case "paragraph":
            return <ParagraphRenderer token={token as Tokens.Paragraph} isLast={isLast} />;
        case "blockquote":
            return <BlockquoteRenderer token={token as Tokens.Blockquote} isLast={isLast} />;
        case "code":
            return <CodeBlockRenderer token={token as Tokens.Code} isLast={isLast} />;
        case "list":
            return <ListRenderer token={token as Tokens.List} depth={depth} isLast={isLast} />;
        case "list_item":
            return <ListItemRenderer token={token as Tokens.ListItem} depth={depth} />;
        case "text":
            return <InlineRenderer token={token as Tokens.Text} />;
        case "space":
            return <Box height={1} />;
        case "hr":
            return (
                <Box marginY={isLast ? 0 : 1}>
                    <Text dimColor>{"─".repeat(50)}</Text>
                </Box>
            );
        default:
            return null;
    }
};

const HeadingRenderer: React.FC<{ token: Tokens.Heading; isLast?: boolean }> = ({ token, isLast = false }) => {
    const depth = token.depth || 1;
    const tokens = token.tokens || [];

    return (
        <Box marginBottom={isLast ? 0 : 1}>
            {depth === 1 && (
                <Text bold color={theme.heading}>
                    <InlineTokensRenderer tokens={tokens} />
                </Text>
            )}
            {depth === 2 && (
                <Text bold color={theme.heading}>
                    <InlineTokensRenderer tokens={tokens} />
                </Text>
            )}
            {depth >= 3 && (
                <Text bold dimColor>
                    <InlineTokensRenderer tokens={tokens} />
                </Text>
            )}
        </Box>
    );
};

const ParagraphRenderer: React.FC<{ token: Tokens.Paragraph; isLast?: boolean }> = ({ token, isLast = false }) => {
    return (
        <Box marginBottom={isLast ? 0 : 1}>
            <Text>
                <InlineTokensRenderer tokens={token.tokens || []} />
            </Text>
        </Box>
    );
};

const BlockquoteRenderer: React.FC<{ token: Tokens.Blockquote; isLast?: boolean }> = ({ token, isLast = false }) => {
    // Blockquotes render their tokens recursively since they can contain block elements
    return (
        <Box marginBottom={isLast ? 0 : 1} marginLeft={2} borderLeft borderColor="gray" paddingLeft={1}>
            {(token.tokens || []).map((t: Token, index: number) => (
                <TokenRenderer key={index} token={t} />
            ))}
        </Box>
    );
};

const CodeBlockRenderer: React.FC<{ token: Tokens.Code; isLast?: boolean }> = ({ token, isLast = false }) => {
    const lines = (token.text || "").split("\n");

    return (
        <Box flexDirection="column" marginBottom={isLast ? 0 : 1} marginLeft={2}>
            {token.lang && (
                <Text dimColor>{`\`\`\`${token.lang}`}</Text>
            )}
            {lines.map((line: string, index: number) => (
                <Text key={index} color={theme.code}>
                    {line || " "}
                </Text>
            ))}
            {token.lang && <Text dimColor>{"```"}</Text>}
        </Box>
    );
};

const ListRenderer: React.FC<{ token: Tokens.List; depth: number; isLast?: boolean }> = ({ token, depth, isLast = false }) => {
    return (
        <Box flexDirection="column" marginBottom={isLast ? 0 : 1}>
            {(token.items || []).map((item: Tokens.ListItem, index: number) => (
                <ListItemRenderer
                    key={index}
                    token={item}
                    depth={depth}
                    ordered={token.ordered}
                    index={index}
                    start={typeof token.start === 'number' ? token.start : undefined}
                />
            ))}
        </Box>
    );
};

const ListItemRenderer: React.FC<{
    token: Tokens.ListItem;
    depth: number;
    ordered?: boolean;
    index?: number;
    start?: number;
}> = ({ token, depth, ordered, index, start }) => {
    const indent = "  ".repeat(depth);
    const bullet = ordered ? `${(start || 1) + (index || 0)}.` : "-";

    return (
        <Box flexDirection="column">
            <Box>
                <Text>
                    {indent}
                    {bullet}{" "}
                    <InlineTokensRenderer tokens={token.tokens || []} />
                </Text>
            </Box>
        </Box>
    );
};

const InlineRenderer: React.FC<{ token: Tokens.Text }> = ({ token }) => {
    return (
        <Text>
            <InlineTokensRenderer tokens={token.tokens || [token]} />
        </Text>
    );
};

const InlineTokensRenderer: React.FC<{ tokens: Token[] }> = ({ tokens }) => {
    return (
        <>
            {tokens.map((token, index) => (
                <InlineTokenRenderer key={index} token={token} />
            ))}
        </>
    );
};

const InlineTokenRenderer: React.FC<{ token: Token }> = ({ token }) => {
    switch (token.type) {
        case "text": {
            const t = token as Tokens.Text;
            return <>{t.text || ""}</>;
        }
        case "br": {
            return <>{"\n"}</>;
        }
        case "strong": {
            const t = token as Tokens.Strong;
            return (
                <Text bold>
                    {t.tokens ? (
                        <InlineTokensRenderer tokens={t.tokens} />
                    ) : (
                        t.text
                    )}
                </Text>
            );
        }
        case "em": {
            const t = token as Tokens.Em;
            return (
                <Text italic>
                    {t.tokens ? (
                        <InlineTokensRenderer tokens={t.tokens} />
                    ) : (
                        t.text
                    )}
                </Text>
            );
        }
        case "codespan": {
            const t = token as Tokens.Codespan;
            return (
                <Text color={theme.code}>
                    {`\`${t.text}\``}
                </Text>
            );
        }
        case "link": {
            const t = token as Tokens.Link;
            return <Text color={theme.link}>{t.text || t.href || ""}</Text>;
        }
        case "del": {
            const t = token as Tokens.Del;
            return (
                <Text strikethrough>
                    {t.tokens ? (
                        <InlineTokensRenderer tokens={t.tokens} />
                    ) : (
                        t.text
                    )}
                </Text>
            );
        }
        default: {
            const t = token as any;
            return <>{t.text || ""}</>;
        }
    }
};
