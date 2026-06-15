import axios from "axios";

export const api = axios.create({
    baseURL: "https://board-score-production.up.railway.app"
});