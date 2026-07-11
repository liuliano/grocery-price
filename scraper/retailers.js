export const RETAILERS = [
  {
    id: "walmart",
    name: "Walmart",
    searchUrl: query => `https://www.walmart.com/search?q=${encodeURIComponent(query)}`
  },
  {
    id: "publix",
    name: "Publix",
    searchUrl: query => `https://www.publix.com/search?searchTerm=${encodeURIComponent(query)}`
  },
  {
    id: "aldi",
    name: "Aldi",
    searchUrl: query => `https://www.aldi.us/results?q=${encodeURIComponent(query)}`
  },
  {
    id: "sams-club",
    name: "Sam's Club",
    searchUrl: query => `https://www.samsclub.com/s/${encodeURIComponent(query)}`
  }
];
