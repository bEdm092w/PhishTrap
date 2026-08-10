// Levenshtein Edit Distance Algorithm
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

// Homoglyph Mapping (Catches non-Latin lookalike characters)
const HOMOGLYPHS = {
  "а": "a", "е": "e", "о": "o", "р": "p", "с": "c", "у": "y", "х": "x",
  "ѕ": "s", "і": "i", "ј": "j", "ԁ": "d", "ԍ": "g", "ӏ": "l", "0": "o",
  "1": "l", "3": "e", "4": "a", "rn": "m", "vv": "w", "5": "s"
};

function normalizeHomoglyphs(str) {
  let out = str.toLowerCase();
  for (const [fake, real] of Object.entries(HOMOGLYPHS)) {
    out = out.split(fake).join(real);
  }
  return out;
}

function getRegistrableParts(hostname) {
  const parts = hostname.toLowerCase().split(".");
  if (parts.length < 2) return { sld: hostname, tld: "" };
  return { sld: parts[parts.length - 2], tld: parts[parts.length - 1] };
}

const SUSPICIOUS_TLDS = new Set([
  "tk", "ml", "ga", "cf", "gq", "xyz", "top", "work", "click", "link",
  "info", "biz", "support", "loan", "win", "review", "kim", "country"
]);

function checkTyposquat(hostname, brands) {
  const host = hostname.toLowerCase();
  const normalizedHost = normalizeHomoglyphs(host);
  const { sld, tld } = getRegistrableParts(host);

  for (const brand of brands) {
    const name = brand.name.toLowerCase();
    const legit = brand.legitDomains.map(d => d.toLowerCase());

    if (legit.includes(host)) return null;

    // 1. Brand name in subdomain/path on unverified domain
    if (normalizedHost.includes(name) && !legit.some(d => host.endsWith("." + d) || host === d)) {
      return {
        type: "brand-in-subdomain",
        brand: brand.name,
        hostname,
        reason: `"${brand.name}" appears in the address, but this is not an official ${brand.name} website.`
      };
    }

    // 2. Near-identical spelling / edit distance check
    const dist = levenshtein(normalizedHost.replace(/\./g, ""), name);
    if (dist > 0 && dist <= 2 && sld.length >= 4) {
      return {
        type: "lookalike-spelling",
        brand: brand.name,
        hostname,
        editDistance: dist,
        reason: `This domain is a lookalike spelling of ${brand.name}'s real website (off by ${dist} character${dist > 1 ? "s" : ""}).`
      };
    }

    // 3. Brand name + suspicious top level domain
    if (normalizedHost.includes(name) && SUSPICIOUS_TLDS.has(tld)) {
      return {
        type: "brand-plus-suspicious-tld",
        brand: brand.name,
        hostname,
        reason: `Uses "${brand.name}" with a high-risk web domain extension (.${tld}).`
      };
    }
  }
  return null;
}

if (typeof module !== "undefined") {
  module.exports = { checkTyposquat, levenshtein, normalizeHomoglyphs };
}