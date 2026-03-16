const url =
  "https://tkthvgvjecihqfnknosj.supabase.co/functions/v1/fetch-secure-questions";
const authHeader =
  "Bearer eyJhbGciOiJIUzI1NiIsImtpZCI6IjJrZ3lBbmpXSnZ5VVMySHgiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3RrdGh2Z3ZqZWNpaHFmbmtub3NqLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI5NWRjNzgzMS0yNjVhLTQ2NjctYWM3ZS05YWM3ZDRmZGFlMDUiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzczMDAxNjU3LCJpYXQiOjE3NzI5OTgwNTcsImVtYWlsIjoiYWJkZWxtb3VtZW5tZXppYW5lNkBnbWFpbC5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsIjoiYWJkZWxtb3VtZW5tZXppYW5lNkBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJzdWIiOiI5NWRjNzgzMS0yNjVhLTQ2NjctYWM3ZS05YWM3ZDRmZGFlMDUifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc3MTk3ODQ4NH1dLCJzZXNzaW9uX2lkIjoiMzg5MWRmYWYtZGNiNy00NGEzLWIwMjMtNmFmMDVjODRlMDU0IiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.KBugCDmDn62QiFGRmuqee1geoHPiqFl_qRAnAuTx38s";
const apikeyHeader =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrdGh2Z3ZqZWNpaHFmbmtub3NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MjgwOTQsImV4cCI6MjA3OTAwNDA5NH0.w6TmuCl85ChtLbzUmQDVTwLxOqjD-9HjBfg2uQZhhQI";

fetch(url, {
  method: "POST",
  headers: {
    authorization: authHeader,
    apikey: apikeyHeader,
    "content-type": "application/json",
  },
  body: JSON.stringify({}),
})
  .then((res) => res.text())
  .then((text) => console.log(text))
  .catch((err) => console.error(err));
