/**
 * LeetCode 55: Jump Game
 * Solve the problem using the Greedy approach.
 * @param {number[]} nums
 * @return {boolean}
 */
var canJump = function(nums) {
    let lastGoodIndex = nums.length - 1;

    for (let i = nums.length - 1; i >= 0; i--) {
        if (i + nums[i] >= lastGoodIndex) {
            lastGoodIndex = i;
        }
    }

 
    return lastGoodIndex === 0;
};

console.log(canJump([2, 3, 1, 1, 4])); // Output: true
console.log(canJump([3, 2, 1, 0, 4])); // Output: false