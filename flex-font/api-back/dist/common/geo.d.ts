export type LatLng = [number, number];
export type Waypoint = {
    lat: number;
    lng: number;
    alt: number;
};
export declare function haversine(a: {
    lat: number;
    lng: number;
}, b: {
    lat: number;
    lng: number;
}): number;
export declare function bearing(a: {
    lat: number;
    lng: number;
}, b: {
    lat: number;
    lng: number;
}): number;
export declare function pointInPolygon(p: {
    lat: number;
    lng: number;
}, poly: LatLng[]): boolean;
export declare function segmentCrossesPolygon(a: LatLng, b: LatLng, poly: LatLng[]): boolean;
export declare function centroid(poly: LatLng[]): LatLng;
