'use client';

interface FormattedDescriptionProps {
    text: string;
    className?: string;
}

/**
 * Cleanly formats project descriptions with proper sections and lists
 */
export default function FormattedDescription({ text, className = '' }: FormattedDescriptionProps) {
    if (!text) return null;

    // Split by the "——" separator which marks different sections
    const sections = text.split(/\s*——\s*/).filter(s => s.trim());

    return (
        <div className={`space-y-6 ${className}`}>
            {sections.map((section, sectionIndex) => {
                const trimmed = section.trim();

                // First section (before any ——) contains key info
                if (sectionIndex === 0) {
                    // Parse key-value pairs like "Project Location: value" or "Timeline: value"
                    const keyValuePairs = parseKeyValuePairs(trimmed);

                    if (keyValuePairs.length > 0) {
                        return (
                            <div key={sectionIndex} className="bg-gradient-to-r from-[#00245D]/5 to-transparent rounded-xl p-5 border border-[#D4C4A8]">
                                <h4 className="text-sm font-bold text-[#00245D] uppercase tracking-wide mb-4 flex items-center gap-2">
                                    <span className="w-6 h-6 bg-[#00245D] rounded flex items-center justify-center text-white text-xs">📋</span>
                                    Key Information
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {keyValuePairs.map((pair, i) => (
                                        <div key={i} className="bg-white rounded-lg p-3 border border-[#D4C4A8]/50 shadow-sm">
                                            <span className="text-xs font-semibold text-[#00245D]/60 uppercase tracking-wide">{pair.label}</span>
                                            <p className="text-sm text-[#00245D] mt-0.5 font-medium leading-relaxed">{pair.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    }

                    // If no key-value pairs, just render as intro paragraph
                    return (
                        <div key={sectionIndex} className="bg-[#D4C4A8]/10 rounded-xl p-4 border-l-4 border-[#00245D]">
                            <p className="text-[#00245D]/80 leading-relaxed">{trimmed}</p>
                        </div>
                    );
                }

                // Other sections have a title followed by content
                return <Section key={sectionIndex} content={trimmed} />;
            })}
        </div>
    );
}

// Parse "Label: Value" patterns from text
function parseKeyValuePairs(text: string): Array<{ label: string; value: string }> {
    const pairs: Array<{ label: string; value: string }> = [];

    // Match patterns like "Project Location: some value" or "Timeline: some value"
    const regex = /([A-Za-z][A-Za-z\s]+?):\s*([^:]+?)(?=\s+[A-Z][A-Za-z\s]+?:|$)/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
        if (match[1] && match[2]) {
            pairs.push({
                label: match[1].trim(),
                value: match[2].trim(),
            });
        }
    }

    return pairs;
}

// Section component to handle different section types
function Section({ content }: { content: string }) {
    // Extract section title (first word(s) before numbers or bullets)
    const titleMatch = content.match(/^([A-Za-z][A-Za-z\s&]+?)(?=\s+\d+\.|\s*$)/);
    const title = titleMatch ? titleMatch[1].trim() : 'Details';
    const restContent = titleMatch ? content.slice(titleMatch[0].length).trim() : content;

    // Check if content has numbered items (1. item, 2. item)
    const hasNumberedItems = /\d+\.\s/.test(restContent);

    // Check if content has bullet items (· or • separated)
    const hasBulletItems = /[·•]/.test(restContent);

    // Get icon based on title
    const icon = getSectionIcon(title);

    return (
        <div className="rounded-xl border border-[#D4C4A8] overflow-hidden shadow-sm">
            {/* Section Header */}
            <div className="bg-[#00245D] text-white px-5 py-3">
                <h4 className="font-semibold text-base flex items-center gap-2">
                    <span>{icon}</span>
                    {title}
                </h4>
            </div>

            {/* Section Content */}
            <div className="bg-white p-5">
                {hasNumberedItems ? (
                    <NumberedList content={restContent} />
                ) : hasBulletItems ? (
                    <BulletList content={restContent} />
                ) : (
                    <p className="text-[#00245D]/75 leading-relaxed">{restContent}</p>
                )}
            </div>
        </div>
    );
}

// Render numbered items with their sub-bullets
function NumberedList({ content }: { content: string }) {
    // Split by numbered items like "1. ", "2. ", etc.
    const items = content.split(/(?=\d+\.\s)/).filter(s => s.trim());

    return (
        <div className="space-y-4">
            {items.map((item, index) => {
                // Extract number and content (using [\s\S] instead of 's' flag for compatibility)
                const match = item.match(/^(\d+)\.\s*([\s\S]+)/);
                if (!match) return null;

                const [, num, itemContent] = match;

                // Check for sub-bullets within this item
                const subItems = itemContent.split(/\s*[·•]\s*/).filter(s => s.trim());
                const hasSubItems = subItems.length > 1;

                return (
                    <div key={index} className="flex gap-3">
                        <div className="flex-shrink-0 w-7 h-7 bg-[#00245D] rounded-lg flex items-center justify-center text-white text-sm font-bold">
                            {num}
                        </div>
                        <div className="flex-1">
                            {hasSubItems ? (
                                <>
                                    <p className="font-semibold text-[#00245D] mb-2">{subItems[0]}</p>
                                    <ul className="space-y-1.5 pl-2 border-l-2 border-[#99D6EA]">
                                        {subItems.slice(1).map((subItem, subIndex) => (
                                            <li key={subIndex} className="flex items-start gap-2 text-sm text-[#00245D]/70">
                                                <span className="text-[#99D6EA] mt-0.5">•</span>
                                                <span className="leading-relaxed">{subItem}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            ) : (
                                <p className="text-[#00245D]/75 leading-relaxed">{itemContent}</p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// Render bullet items
function BulletList({ content }: { content: string }) {
    const items = content.split(/\s*[·•]\s*/).filter(s => s.trim());

    return (
        <ul className="space-y-2">
            {items.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 bg-[#99D6EA] rounded-full mt-2 flex-shrink-0"></span>
                    <span className="text-[#00245D]/75 leading-relaxed text-sm">{item}</span>
                </li>
            ))}
        </ul>
    );
}

// Get appropriate icon for section
function getSectionIcon(title: string): string {
    const lowerTitle = title.toLowerCase();

    if (lowerTitle.includes('overview')) return '📋';
    if (lowerTitle.includes('scope')) return '🔧';
    if (lowerTitle.includes('requirement')) return '📝';
    if (lowerTitle.includes('deliverable')) return '📦';
    if (lowerTitle.includes('experience')) return '🏆';
    if (lowerTitle.includes('schedule') || lowerTitle.includes('timeline')) return '📅';
    if (lowerTitle.includes('site') || lowerTitle.includes('location')) return '📍';
    if (lowerTitle.includes('additional') || lowerTitle.includes('info')) return 'ℹ️';

    return '📋';
}
