/**
 * @file index.d.ts
 * @description Type definitions for the TabsBroadcast class.
 *
 * @license MIT
 * @autor Andrei (Ravy) Rovnyi
 */
import { TDefaultConfig } from './src/types';

export default class TabsBroadcast {
    constructor(config?: TDefaultConfig);

    on(type: string, callback: (payload: any) => void): void;

    onList(list: [string, (payload: any) => void][]): void;

    once(type: string, callback: (payload: any) => void): void;

    onceList(list: [string, (payload: any) => void][]): void;

    off(type: string): void;

    emit(type: string, payload?: any): void;

    isPrimary(): boolean;

    setConfig(config?: TDefaultConfig): void;

    destroy(): void;
}
