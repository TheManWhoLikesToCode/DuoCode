/**
 * @author Jaydin Freeman
 * 
 * @file LeetCode User Profile Scraper
 * 
 * @description A Node.js script that fetches profile information for a set of usernames 
 * from the LeetCode website and modifies the data to make it easier to sort and process. 
 * The script utilizes the node-fetch library for making HTTP requests and the fs library 
 * for reading the list of usernames from a local JSON file. The script includes functions 
 * for fetching profile data for a single username and for fetching profile data for all 
 * usernames in the watchlist. The fetched data is processed to extract relevant information 
 * and is returned as an array of profile objects. The script also includes utility functions 
 * for sorting and modifying the data.
 * 
 */


import fetch from "node-fetch";
import fs from "fs";

const usernames = JSON.parse(fs.readFileSync("./data/watchlist.json"));

const url = "https://leetcode.com/graphql";
const body = {
  query:
    "\n    query userProblemsSolved($username: String!) {\n  allQuestionsCount {\n    difficulty\n    count\n  }\n  matchedUser(username: $username) {\n    problemsSolvedBeatsStats {\n      difficulty\n      percentage\n    }\n    submitStatsGlobal {\n      acSubmissionNum {\n        difficulty\n        count\n      }\n    }\n  }\n}\n    ",
  variables: {
    username: null,
  },
};

const fetchProfileData = async (username) => {
  if (!username) {
    console.error("No username specified.");
    return null;
  }
  body.variables.username = username;

  try {
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "en-US,en;q=0.5",
        Connection: "keep-alive",
      },
    });
    const data = await response.json();

    if (!data.data.matchedUser) {
      console.error(`No profile found for username: ${username}`);
      return null;
    }

    const modifiedProblemsSolvedBeatsStats = {};
    data.data.matchedUser.problemsSolvedBeatsStats.forEach((entry) => {
      modifiedProblemsSolvedBeatsStats[entry.difficulty] = entry.percentage;
    });
    const modifiedSubmitStatsGlobal = {};
    data.data.matchedUser.submitStatsGlobal.acSubmissionNum.forEach((entry) => {
      modifiedSubmitStatsGlobal[entry.difficulty] = entry.count;
    });

    return {
      username,
      submitCounts: modifiedSubmitStatsGlobal,
      beatsPercentage: modifiedProblemsSolvedBeatsStats,
    };
  } catch (error) {
    console.error(error);
    return null;
  }
};

const fetchAllProfileData = async () => {
  if (!usernames) {
    console.error("No usernames found.");
    return [];
  }

  const profiles = [];
  for (const username of usernames) {
    const profile = await fetchProfileData(username);
    if (profile) {
      profiles.push(profile);
    }
  }
  profiles.sort((a, b) => a.username.localeCompare(b.username));
  return profiles;
};

export { fetchProfileData, fetchAllProfileData };
function sortProfiles(profiles) {
  profiles.sort((a, b) => {
    return a.username.localeCompare(b.username);
  });
  return profiles;
}

function modifyData(data) {
  let modifiedProblemsSolvedBeatsStats = {};
  data.matchedUser.problemsSolvedBeatsStats.forEach((entry) => {
    modifiedProblemsSolvedBeatsStats[entry.difficulty] = entry.percentage;
  });
  let modifiedSubmitStatsGlobal = {};
  data.matchedUser.submitStatsGlobal.acSubmissionNum.forEach((entry) => {
    modifiedSubmitStatsGlobal[entry.difficulty] = entry.count;
  });
  return {
    username: data.username,
    submitCounts: modifiedSubmitStatsGlobal,
    beatsPercentage: modifiedProblemsSolvedBeatsStats,
  };
}

function fetchData(url, body) {
  return fetch(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      Accept: "*/*",
      "Accept-Encoding": "gzip, deflate, br",
      "Accept-Language": "en-US,en;q=0.5",
      Connection: "keep-alive",
    },
  })
    .then((res) => res.json())
    .then((data) => data.data)
    .then((data) => {
      if (!data.matchedUser) {
        console.error("Couldn't find user: " + uname);
        return;
      }
      return modifyData(data);
    })
    .catch((err) => {
      console.error(err);
    });
}



// Testing
fetchProfileData("TheManWhoLikesToCode").then((data) => console.log(data));
fetchAllProfileData().then((data) => console.log(data));
