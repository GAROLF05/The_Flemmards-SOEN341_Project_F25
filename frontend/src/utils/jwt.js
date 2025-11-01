import { jwtDecode } from "jwt-decode";

export function decodeToken () {
    const token = localStorage.getItem("auth-token");

    if (token) {
        const user = jwtDecode(token);

        return user;
    }

    return undefined;
}
