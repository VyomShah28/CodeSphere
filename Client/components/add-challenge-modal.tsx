"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookOpen, Code, Loader2, AlertCircle } from "lucide-react";
import axios from "axios";

interface AddChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (mode: "manual" | "leetcode", data?: any) => void;
}

// Dummy LeetCode problems for testing
const DUMMY_LEETCODE_PROBLEMS: Record<string, any> = {
  "1": {
    title: "Two Sum",
    difficulty: "Easy",
    description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.

Example 1:
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].

Example 2:
Input: nums = [3,2,4], target = 6
Output: [1,2]

Example 3:
Input: nums = [3,3], target = 6
Output: [0,1]`,
    constraints: `• 2 ≤ nums.length ≤ 10⁴
• -10⁹ ≤ nums[i] ≤ 10⁹
• -10⁹ ≤ target ≤ 10⁹
• Only one valid answer exists.`,
    sampleInput: `[2,7,11,15]
9`,
    sampleOutput: `[0,1]`,
    solutions: {
      cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> map;
        for (int i = 0; i < nums.size(); i++) {
            int complement = target - nums[i];
            if (map.find(complement) != map.end()) {
                return {map[complement], i};
            }
            map[nums[i]] = i;
        }
        return {};
    }
};`,
      java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        return new int[0];
    }
}`,
      python: `class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        hashmap = {}
        for i in range(len(nums)):
            complement = target - nums[i]
            if complement in hashmap:
                return [hashmap[complement], i]
            hashmap[nums[i]] = i
        return []`,
    },
  },
  "3": {
    title: "Longest Substring Without Repeating Characters",
    difficulty: "Medium",
    description: `Given a string s, find the length of the longest substring without repeating characters.

Example 1:
Input: s = "abcabcbb"
Output: 3
Explanation: The answer is "abc", with the length of 3.

Example 2:
Input: s = "bbbbb"
Output: 1
Explanation: The answer is "b", with the length of 1.

Example 3:
Input: s = "pwwkew"
Output: 3
Explanation: The answer is "wke", with the length of 3.
Notice that the answer must be a substring, "pwke" is a subsequence and not a substring.`,
    constraints: `• 0 ≤ s.length ≤ 5 * 10⁴
• s consists of English letters, digits, symbols and spaces.`,
    sampleInput: `"abcabcbb"`,
    sampleOutput: `3`,
    solutions: {
      cpp: `class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        unordered_set<char> charSet;
        int left = 0, maxLength = 0;
        
        for (int right = 0; right < s.length(); right++) {
            while (charSet.find(s[right]) != charSet.end()) {
                charSet.erase(s[left]);
                left++;
            }
            charSet.insert(s[right]);
            maxLength = max(maxLength, right - left + 1);
        }
        
        return maxLength;
    }
};`,
      java: `class Solution {
    public int lengthOfLongestSubstring(String s) {
        Set<Character> charSet = new HashSet<>();
        int left = 0, maxLength = 0;
        
        for (int right = 0; right < s.length(); right++) {
            while (charSet.contains(s.charAt(right))) {
                charSet.remove(s.charAt(left));
                left++;
            }
            charSet.add(s.charAt(right));
            maxLength = Math.max(maxLength, right - left + 1);
        }
        
        return maxLength;
    }
}`,
      python: `class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        char_set = set()
        left = 0
        max_length = 0
        
        for right in range(len(s)):
            while s[right] in char_set:
                char_set.remove(s[left])
                left += 1
            char_set.add(s[right])
            max_length = max(max_length, right - left + 1)
        
        return max_length`,
    },
  },
  "4": {
    title: "Median of Two Sorted Arrays",
    difficulty: "Hard",
    description: `Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.

The overall run time complexity should be O(log (m+n)).

Example 1:
Input: nums1 = [1,3], nums2 = [2]
Output: 2.00000
Explanation: merged array = [1,2,3] and median is 2.

Example 2:
Input: nums1 = [1,2], nums2 = [3,4]
Output: 2.50000
Explanation: merged array = [1,2,3,4] and median is (2 + 3) / 2 = 2.5.`,
    constraints: `• nums1.length == m
• nums2.length == n
• 0 ≤ m ≤ 1000
• 0 ≤ n ≤ 1000
• 1 ≤ m + n ≤ 2000
• -10⁶ ≤ nums1[i], nums2[i] ≤ 10⁶`,
    sampleInput: `[1,3]
[2]`,
    sampleOutput: `2.00000`,
    solutions: {
      cpp: `class Solution {
public:
    double findMedianSortedArrays(vector<int>& nums1, vector<int>& nums2) {
        if (nums1.size() > nums2.size()) {
            return findMedianSortedArrays(nums2, nums1);
        }
        
        int m = nums1.size(), n = nums2.size();
        int left = 0, right = m;
        
        while (left <= right) {
            int partitionX = (left + right) / 2;
            int partitionY = (m + n + 1) / 2 - partitionX;
            
            int maxLeftX = (partitionX == 0) ? INT_MIN : nums1[partitionX - 1];
            int minRightX = (partitionX == m) ? INT_MAX : nums1[partitionX];
            
            int maxLeftY = (partitionY == 0) ? INT_MIN : nums2[partitionY - 1];
            int minRightY = (partitionY == n) ? INT_MAX : nums2[partitionY];
            
            if (maxLeftX <= minRightY && maxLeftY <= minRightX) {
                if ((m + n) % 2 == 0) {
                    return (max(maxLeftX, maxLeftY) + min(minRightX, minRightY)) / 2.0;
                } else {
                    return max(maxLeftX, maxLeftY);
                }
            } else if (maxLeftX > minRightY) {
                right = partitionX - 1;
            } else {
                left = partitionX + 1;
            }
        }
        
        return 0.0;
    }
};`,
      java: `class Solution {
    public double findMedianSortedArrays(int[] nums1, int[] nums2) {
        if (nums1.length > nums2.length) {
            return findMedianSortedArrays(nums2, nums1);
        }
        
        int m = nums1.length, n = nums2.length;
        int left = 0, right = m;
        
        while (left <= right) {
            int partitionX = (left + right) / 2;
            int partitionY = (m + n + 1) / 2 - partitionX;
            
            int maxLeftX = (partitionX == 0) ? Integer.MIN_VALUE : nums1[partitionX - 1];
            int minRightX = (partitionX == m) ? Integer.MAX_VALUE : nums1[partitionX];
            
            int maxLeftY = (partitionY == 0) ? Integer.MIN_VALUE : nums2[partitionY - 1];
            int minRightY = (partitionY == n) ? Integer.MAX_VALUE : nums2[partitionY];
            
            if (maxLeftX <= minRightY && maxLeftY <= minRightX) {
                if ((m + n) % 2 == 0) {
                    return (Math.max(maxLeftX, maxLeftY) + Math.min(minRightX, minRightY)) / 2.0;
                } else {
                    return Math.max(maxLeftX, maxLeftY);
                }
            } else if (maxLeftX > minRightY) {
                right = partitionX - 1;
            } else {
                left = partitionX + 1;
            }
        }
        
        return 0.0;
    }
}`,
      python: `class Solution:
    def findMedianSortedArrays(self, nums1: List[int], nums2: List[int]) -> float:
        if len(nums1) > len(nums2):
            return self.findMedianSortedArrays(nums2, nums1)
        
        m, n = len(nums1), len(nums2)
        left, right = 0, m
        
        while left <= right:
            partition_x = (left + right) // 2
            partition_y = (m + n + 1) // 2 - partition_x
            
            max_left_x = float('-inf') if partition_x == 0 else nums1[partition_x - 1]
            min_right_x = float('inf') if partition_x == m else nums1[partition_x]
            
            max_left_y = float('-inf') if partition_y == 0 else nums2[partition_y - 1]
            min_right_y = float('inf') if partition_y == n else nums2[partition_y]
            
            if max_left_x <= min_right_y and max_left_y <= min_right_x:
                if (m + n) % 2 == 0:
                    return (max(max_left_x, max_left_y) + min(min_right_x, min_right_y)) / 2.0
                else:
                    return max(max_left_x, max_left_y)
            elif max_left_x > min_right_y:
                right = partition_x - 1
            else:
                left = partition_x + 1
        
        return 0.0`,
    },
  },
  "121": {
    title: "Best Time to Buy and Sell Stock",
    difficulty: "Easy",
    description: `You are given an array prices where prices[i] is the price of a given stock on the ith day.

You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.

Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.

Example 1:
Input: prices = [7,1,5,3,6,4]
Output: 5
Explanation: Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5.
Note that buying on day 2 and selling on day 1 is not allowed because you must buy before you sell.

Example 2:
Input: prices = [7,6,4,3,1]
Output: 0
Explanation: In this case, no transactions are done and the max profit = 0.`,
    constraints: `• 1 ≤ prices.length ≤ 10⁵
• 0 ≤ prices[i] ≤ 10⁴`,
    sampleInput: `[7,1,5,3,6,4]`,
    sampleOutput: `5`,
    solutions: {
      cpp: `class Solution {
public:
    int maxProfit(vector<int>& prices) {
        int minPrice = prices[0];
        int maxProfit = 0;
        
        for (int i = 1; i < prices.size(); i++) {
            if (prices[i] < minPrice) {
                minPrice = prices[i];
            } else if (prices[i] - minPrice > maxProfit) {
                maxProfit = prices[i] - minPrice;
            }
        }
        
        return maxProfit;
    }
};`,
      java: `class Solution {
    public int maxProfit(int[] prices) {
        int minPrice = prices[0];
        int maxProfit = 0;
        
        for (int i = 1; i < prices.length; i++) {
            if (prices[i] < minPrice) {
                minPrice = prices[i];
            } else if (prices[i] - minPrice > maxProfit) {
                maxProfit = prices[i] - minPrice;
            }
        }
        
        return maxProfit;
    }
}`,
      python: `class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        min_price = prices[0]
        max_profit = 0
        
        for i in range(1, len(prices)):
            if prices[i] < min_price:
                min_price = prices[i]
            elif prices[i] - min_price > max_profit:
                max_profit = prices[i] - min_price
        
        return max_profit`,
    },
  },
};

export function AddChallengeModal({
  isOpen,
  onClose,
  onSelectMode,
}: AddChallengeModalProps) {
  const [leetcodeNumber, setLeetcodeNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleManualMode = () => {
    onSelectMode("manual");
    onClose();
  };

  const handleLeetCodeMode = async () => {
    if (!leetcodeNumber.trim()) {
      setError("Please enter a LeetCode problem number");
      return;
    }

    setIsLoading(true);
    setError("");

    // Simulate API call delay

    try {

      const response = await axios.post("http://localhost:8000/api/get_leetcode_problem_description", {
        question_number: leetcodeNumber,
      });
     
      
      const problemData = response.data.challange;
      console.log("Received problem data:", problemData);
      const parsedData = JSON.parse(problemData);

      if (problemData) {
        onSelectMode("leetcode", parsedData);
        onClose();
        setLeetcodeNumber("");
      } else {
        setError(`Problem #${leetcodeNumber} not found. Try: 1, 3, 4, or 121`);
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching LeetCode problem:", error);
      setError("Failed to fetch problem data. Please try again later.");
      setIsLoading(false);
      return;
    }
  };

  const handleClose = () => {
    setLeetcodeNumber("");
    setError("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>How do you want to add a challenge?</DialogTitle>
          <DialogDescription>
            Choose your preferred method to create a new coding challenge
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          {/* Manual Entry */}
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={handleManualMode}
          >
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg">Manual Entry</CardTitle>
              <CardDescription>
                Create a challenge from scratch with full customization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Write your own problem statement</li>
                <li>• Define custom constraints</li>
                <li>• Upload test case files</li>
                <li>• AI-powered test case generation</li>
              </ul>
            </CardContent>
          </Card>

          {/* LeetCode Import */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-2">
                <Code className="h-6 w-6 text-emerald-600" />
              </div>
              <CardTitle className="text-lg">Import from LeetCode</CardTitle>
              <CardDescription>
                Import existing problems with solutions and test cases
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="text-sm text-slate-600 space-y-1 mb-4">
                <li>• Pre-written problem statements</li>
                <li>• Multiple language solutions</li>
                <li>• Automatic test case generation</li>
                <li>• Verified problem quality</li>
              </ul>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="leetcode-number">
                    LeetCode Problem Number
                  </Label>
                  <Input
                    id="leetcode-number"
                    placeholder="e.g., 1, 3, 4, 121"
                    value={leetcodeNumber}
                    onChange={(e) => {
                      setLeetcodeNumber(e.target.value);
                      setError("");
                    }}
                    className={error ? "border-red-500" : ""}
                  />
                  {error && (
                    <div className="flex items-center space-x-1 text-red-600 text-sm mt-1">
                      <AlertCircle className="h-4 w-4" />
                      <span>{error}</span>
                    </div>
                  )}
                  <p className="text-xs text-slate-500 mt-1">
                    Available demo problems: 1, 3, 4, 121
                  </p>
                </div>

                <Button
                  onClick={handleLeetCodeMode}
                  disabled={isLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Fetching Problem...
                    </>
                  ) : (
                    "Import Problem"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
