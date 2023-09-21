export function damerauLevenshteinDistance(str1, str2) {
    const lenStr1 = str1.length;
    const lenStr2 = str2.length;

    const d = new Array(lenStr1 + 1).fill(null).map(() => new Array(lenStr2 + 1).fill(0));

    for (let i = 0; i <= lenStr1; i++) {
        d[i][0] = i;
    }
    for (let j = 0; j <= lenStr2; j++) {
        d[0][j] = j;
    }

    for (let i = 1; i <= lenStr1; i++) {
        for (let j = 1; j <= lenStr2; j++) {
            let cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            d[i][j] = Math.min(
                d[i - 1][j] + 1,            // insertion
                d[i][j - 1] + 1,            // deletion
                d[i - 1][j - 1] + cost      // substitution
            );

            if (i > 1 && j > 1 && str1[i - 1] === str2[j - 2] && str1[i - 2] === str2[j - 1]) {
                d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + cost);    // transposition
            }
        }
    }

    return d[lenStr1][lenStr2];

}   // damerauLevenshteinDistance

export function checkTldDifference(domain1, domain2) {
    // TODO
}