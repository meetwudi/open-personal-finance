import { getApp } from "firebase/app";
import { getFunctions, httpsCallable } from "firebase/functions";

// FIXME: Not used
export async function ffGetInfo(): Promise<any> {
    const functions = getFunctions(getApp());
    const fn = httpsCallable(functions, "getInfo");
    const result = await fn();
    return result.data;
}

export async function ffCreateLinkToken(): Promise<any> {
    const functions = getFunctions(getApp());
    const fn = httpsCallable(functions, "createLinkToken");
    const result = await fn();
    return result.data;
}

export async function ffSetAccessToken(publicToken: string): Promise<any> {
    const functions = getFunctions(getApp());
    const fn = httpsCallable(functions, "setAccessToken");
    const result = await fn({ public_token: publicToken });
    return result.data;
}

export async function ffGetTransactions(): Promise<any> {
    const functions = getFunctions(getApp());
    const fn = httpsCallable(functions, "getTransactions");
    const result = await fn();
    return result.data;
}