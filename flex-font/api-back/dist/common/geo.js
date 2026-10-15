const R = 6371000;
const toRad = (d) => (d * Math.PI) / 180;
export function haversine(a, b) {
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const s = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
}
export function bearing(a, b) {
    const y = Math.sin(toRad(b.lng - a.lng)) * Math.cos(toRad(b.lat));
    const x = Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
        Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(toRad(b.lng - a.lng));
    return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}
export function pointInPolygon(p, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const [yi, xi] = poly[i];
        const [yj, xj] = poly[j];
        const intersect = xi > p.lng !== xj > p.lng && p.lat < ((yj - yi) * (p.lng - xi)) / (xj - xi) + yi;
        if (intersect)
            inside = !inside;
    }
    return inside;
}
function segmentsIntersect(a, b, c, d) {
    const ccw = (p, q, r) => (r[1] - p[1]) * (q[0] - p[0]) > (q[1] - p[1]) * (r[0] - p[0]);
    return ccw(a, c, d) !== ccw(b, c, d) && ccw(a, b, c) !== ccw(a, b, d);
}
export function segmentCrossesPolygon(a, b, poly) {
    if (pointInPolygon({ lat: a[0], lng: a[1] }, poly) || pointInPolygon({ lat: b[0], lng: b[1] }, poly))
        return true;
    for (let i = 0; i < poly.length; i++) {
        if (segmentsIntersect(a, b, poly[i], poly[(i + 1) % poly.length]))
            return true;
    }
    return false;
}
export function centroid(poly) {
    const n = poly.length;
    return [poly.reduce((s, p) => s + p[0], 0) / n, poly.reduce((s, p) => s + p[1], 0) / n];
}
//# sourceMappingURL=geo.js.map