let array = new Array(4).fill([]); // this code creates one reference to the array then passes it to fill

console.log(array);
console.log(array[0]);

array[0].push("once");

console.log(array);
