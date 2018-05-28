type Lookup<T> = {
    [index: string]: T
}

const empty = {};
let fakeEmpty = {};
let fakeAny: {};
let fakeObject: Object = {};
let fakeAnyLookup: Set<Object>;
let fakeLookup: { [key: string]:Object };
let fakerLookup: Lookup<Object>;

fakeAny = {
    something: 1
}

fakeLookup["hello"] = 123;
fakeLookup["hey"] = window;

let hello = {
    test: 1
};

const myVariable: number = 42;
const myNumber = 42;
const str = "hey";