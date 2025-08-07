export const ENV = new Proxy(process.env, {
    get(target, prop) {
        if (target[prop.toString()]) {
            return target[prop.toString()];
        } else {
            throw new Error(`environment ${prop.toString()} wasn't provided`);
        }
    },
});
