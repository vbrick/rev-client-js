/**
 * simple helper function to parse CSV data into JSON
 */
export function parseCSV(raw: string) {
    raw = raw.replace(/(\r\n|\n|\r)/gm, '\n').replace(/\n$/g, '');

    let cur = '';
    let inQuote = false;
    let fieldQuoted = false;
    let field = '';
    let row: string[] = [];
    let out: string[][] = [];
    let i: number;
    const n = raw.length;

    function processField(field: string) {
        if (fieldQuoted) { return field; }
        if (field === '') { return undefined; }
        return field.trim();
    }

    for (i = 0; i < n; i += 1) {
        cur = raw.charAt(i);

        if (!inQuote && (cur === ',' || cur === '\n')) {
            field = processField(field);
            row.push(field);
            if (cur === '\n') {
                out.push(row);
                row = [];
            }
            field = '';
            fieldQuoted = false;
        } else if (cur === '"') {
            if (!inQuote) {
                inQuote = true;
                fieldQuoted = true;
            } else {
                if (raw.charAt(i + 1) === '"') {
                    field += '"';
                    i += 1;
                } else {
                    inQuote = false;
                }
            }
        } else {
            field += cur === '\n' ? '\n' : cur;
        }
    }

    // Add the last field
    field = processField(field);
    row.push(field);
    out.push(row);

    const headers = out.shift();
    return out
        .map((line: string[]) => {
            const obj: Record<string, string> = { };
            line
                .forEach((field, i) => {
                    if (field !== undefined) {
                        obj[headers[i]] = field;
                    }
                });
            return obj;
        });
}
