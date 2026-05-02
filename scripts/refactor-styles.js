const fs = require('fs');
const path = require('path');

const REPLACEMENTS = [
    ['style="flex: 1;"',                                        'u-flex1'],
    ['style="display: flex; align-items: center; gap: 4px;"',   'u-flex-ac-4'],
    ['style="margin-bottom: 24px;"',                            'u-mb24'],
    ['style="margin-bottom: 20px;"',                            'u-mb20'],
    ['style="display: flex; gap: 16px;"',                       'u-flex-16'],
    ['style="display: flex; gap: 12px; align-items: center;"',  'u-flex-ac-12'],
    ['style="display: flex; flex-direction: column; gap: 10px;"','u-flex-col-10'],
    ['style="width: 100%;"',                                    'u-w100'],
    ['style="text-align: center;"',                             'u-text-center'],
    ['style="margin: 0;"',                                      'u-m0'],
    ['style="margin:0;"',                                       'u-m0'],
    ['style="color: var(--text-muted);"',                       'u-text-muted'],
    ['style="color: var(--red);"',                              'u-text-red'],
];

const HTML_FILES = fs.readdirSync(path.join(__dirname, '..'))
    .filter(f => f.endsWith('.html'))
    .map(f => path.join(__dirname, '..', f));

let totalReplaced = 0;

for (const filePath of HTML_FILES) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    for (const [styleAttr, utilClass] of REPLACEMENTS) {
        let idx = 0;
        while ((idx = content.indexOf(styleAttr, idx)) !== -1) {
            // Find the start of the containing opening tag
            const tagStart = content.lastIndexOf('<', idx);
            const tagSlice = content.slice(tagStart, idx + styleAttr.length);

            // Check if there's already a class attribute in this tag
            const classMatch = /class="([^"]*)"/.exec(tagSlice);
            if (classMatch) {
                // Class exists — add utility class to it
                const existingClass = classMatch[1];
                if (existingClass.split(/\s+/).includes(utilClass)) {
                    // Already has this class, just remove the style attr
                    content = content.slice(0, idx) + content.slice(idx + styleAttr.length);
                } else {
                    // Insert util class into existing class value
                    const newClass = (existingClass + ' ' + utilClass).trim();
                    const beforeStyle = content.slice(0, idx) + content.slice(idx + styleAttr.length);
                    content = beforeStyle;
                    // Now find and update the class in the tag
                    const tagStartInNew = content.lastIndexOf('<', idx);
                    const oldClassAttr = `class="${existingClass}"`;
                    const newClassAttr = `class="${newClass}"`;
                    const tagEnd = content.indexOf('>', tagStartInNew);
                    const tagStr = content.slice(tagStartInNew, tagEnd + 1);
                    const updatedTag = tagStr.replace(oldClassAttr, newClassAttr);
                    content = content.slice(0, tagStartInNew) + updatedTag + content.slice(tagEnd + 1);
                }
            } else {
                // No class — replace style with class
                content = content.slice(0, idx) + `class="${utilClass}"` + content.slice(idx + styleAttr.length);
                idx += `class="${utilClass}"`.length;
            }
            changed = true;
            totalReplaced++;
        }
    }

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated:', path.basename(filePath));
    }
}

console.log(`\nTotal replacements: ${totalReplaced}`);
