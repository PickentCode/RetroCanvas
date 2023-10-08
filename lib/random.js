// TO-DO Seeded true random. Wave-function collapse. Simple, perlin and voronoi noise. Cellular automata (worms-like maps).

function pseudoRandom(seed) {
    const a = 1664525;
    const c = 1013904223;
    const m = Math.pow(2, 32);  // 2^32
    const largePrime = 2147483647; // a large prime number
    seed = (a * ((seed * largePrime) % m) + c) % m;
    return seed / m;
}