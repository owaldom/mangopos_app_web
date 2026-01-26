import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ScaleStatus {
    connected: boolean;
    portName?: string;
    isStable: boolean;
    error?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ScaleService {
    private port: any = null;
    private reader: any = null;
    private keepReading = false;
    private pollInterval: any = null;

    private weightSubject = new BehaviorSubject<number>(0);
    public weight$ = this.weightSubject.asObservable();

    private statusSubject = new BehaviorSubject<ScaleStatus>({ connected: false, isStable: false });
    public status$ = this.statusSubject.asObservable();

    private lastWeights: number[] = [];
    private readonly STABILITY_THRESHOLD = 0.005; // 5 gramos
    private readonly STABILITY_COUNT = 5;

    constructor(private zone: NgZone) {
        this.checkAuthorizedPorts();
    }

    // Verificar si hay puertos ya autorizados
    private async checkAuthorizedPorts() {
        if ('serial' in navigator) {
            const serial = (navigator as any).serial;
            const ports = await serial.getPorts();
            if (ports.length > 0) {
                // Intentar conectar al último usado o primero disponible
                console.log('Puertos autorizados encontrados:', ports.length);
            }
        }
    }

    async connect(): Promise<boolean> {
        if (!('serial' in navigator)) {
            this.statusSubject.next({ connected: false, isStable: false, error: 'Web Serial no soportado' });
            return false;
        }

        try {
            const serial = (navigator as any).serial;
            this.port = await serial.requestPort();
            await this.port.open({ baudRate: 9600, dataBits: 8, stopBits: 1, parity: 'none' });

            this.statusSubject.next({ connected: true, isStable: false });
            this.startReading();
            return true;
        } catch (err) {
            console.error('Error al conectar balanza:', err);
            this.statusSubject.next({ connected: false, isStable: false, error: String(err) });
            return false;
        }
    }

    async disconnect() {
        this.keepReading = false;
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
        if (this.reader) {
            await this.reader.cancel();
        }
        if (this.port) {
            await this.port.close();
        }
        this.port = null;
        this.statusSubject.next({ connected: false, isStable: false });
    }

    private async startReading() {
        this.keepReading = true;

        // Iniciar polling si es necesario (Protocolo Samsung envía ENQ cada 500ms)
        this.pollInterval = setInterval(() => {
            this.requestWeight();
        }, 500);

        while (this.port?.readable && this.keepReading) {
            this.reader = this.port.readable.getReader();
            try {
                let buffer = '';
                while (true) {
                    const { value, done } = await this.reader.read();
                    if (done) break;
                    if (value) {
                        // Procesar byte a byte como en ScaleComm.java
                        for (let i = 0; i < value.length; i++) {
                            const b = value[i];

                            if (b === 0x1E) { // RS (Record Separator) - Fin de lectura en Samsung
                                const weight = parseFloat(buffer);
                                if (!isNaN(weight)) {
                                    this.zone.run(() => this.updateWeight(weight / 1000.0));
                                }
                                buffer = '';
                            } else if (b >= 0x30 && b <= 0x39) { // Dígitos '0'-'9'
                                buffer += String.fromCharCode(b);
                            } else if (b === 0x2E) { // Punto decimal
                                buffer += '.';
                            } else {
                                // Carácter inválido, reset buffer
                                buffer = '';
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error de lectura:', error);
            } finally {
                this.reader.releaseLock();
            }
        }
    }

    private updateWeight(weight: number) {
        this.weightSubject.next(weight);

        // Lógica de estabilidad
        this.lastWeights.push(weight);
        if (this.lastWeights.length > this.STABILITY_COUNT) {
            this.lastWeights.shift();
        }

        if (this.lastWeights.length === this.STABILITY_COUNT) {
            const max = Math.max(...this.lastWeights);
            const min = Math.min(...this.lastWeights);
            const isStable = (max - min) <= this.STABILITY_THRESHOLD;

            const currentStatus = this.statusSubject.value;
            if (currentStatus.isStable !== isStable) {
                this.statusSubject.next({ ...currentStatus, isStable });
            }
        }
    }

    // Solicitar una lectura (para protocolos que requieren comando ENQ)
    async requestWeight() {
        if (this.port?.writable) {
            const writer = this.port.writable.getWriter();
            const data = new Uint8Array([0x05]); // ENQ command
            await writer.write(data);
            writer.releaseLock();
        }
    }
}
