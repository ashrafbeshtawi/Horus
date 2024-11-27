export default {
    getRandomInt: (min, max) => {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
    },
    getRandomFloat: (min, max) => {
        return Math.random() * (max - min) + min;
    }
}