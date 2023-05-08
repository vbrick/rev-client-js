export interface Zone {
    id: string;
    parentZoneId?: string | null;
    name: string;
    supportsMulticast: boolean;
    ipAddresses?: string[];
    ipAddressRanges?: Array<{
        start: string;
        end: string;
    }>;
    targetDevices: Zone.TargetDevice[];
    childZones?: Zone[];

    slideDelay?: {
        overrideAccount: boolean;
        isEnabled: boolean;
        delaySeconds: number;
    };

    revConnectEnabled?: boolean;
    revConnectSetting?: null | {
        disableFallback: boolean;
        maxZoneMeshes: number;
        groupPeersByZoneIPAddresses: boolean;
        useUls: boolean;
        revConnectConfig?: null | Record<string, any>;
    };
    rendition?: {
        highBitrate: boolean;
        midBitrate: boolean;
        lowBitrate: boolean;
    }
}

export namespace Zone {
    export interface CreateRequest {
        id?: string;
        parentZoneId?: string;
        ipAddresses?: string[];
        ipAddressRanges?: Array<{ start: string, end: string; }>;
        targetDevices?: TargetDeviceRequest[];
        supportsMulticast?: boolean;
        overrideAccountSlideDelay?: boolean;
        slideDelaySeconds?: number;
        revConnectEnabled?: boolean;
        /* When revConnectEnabled, add or edit a Rev Connect Zone. */
        revConnectSetting?: {
            /**
             * Disables fallback to a unicast stream (if available) which means the zone only supports multicast or Rev Connect.
             */
            disableFallback?: boolean;
            /**
              * 0; Defines the upper limit of what can be used within the zone based on licensing retrictions.
              */
            maxZoneMeshes?: number;
            groupPeersByZoneIPAddresses?: boolean;
            useUls?: boolean;
        };
        /**
         * Rendition selection for Auto Unicast of Cloud Streams in zone. All bitrates are seleced by default. All bitrates must be selected if any zone device is a DME that has version lower than 3.28.
         */
        zoneRendition?: {
            highBitrate: boolean;
            midBitrate: boolean;
            lowBitrate: boolean;
        }
    }
    export interface TargetDevice {
        /**
         * Possible settings can be 'Custom', 'Encoder', 'Dme', 'Akamai'
         */
        deviceType: 'Custom' | 'Encoder' | 'Dme' | 'Akamai';
        /**
         * Device Id of target device
         */
        deviceId: string;
        /**
         * Status of target device
         */
        isActive: boolean;
        /**
         * Specifies if no VOD videos retrieved if true
         */
        liveOnly: boolean;
        /**
         * Rev stream names added to the zone from this device
         */
        streams: string[];
    }
    export interface TargetDeviceRequest {
        /**
         * Possible settings can be 'Custom', 'Encoder', 'Dme', 'Akamai'
         */
        deviceType: 'Custom' | 'Encoder' | 'Dme' | 'Akamai';
        /**
          * Device Id of target device
          */
        deviceId: string;
        /**
          * Status of target device
          */
        isActive?: boolean;
        /**
          * Specifies if no VOD videos retrieved if true
          */
        liveOnly?: boolean;
        /**
          * Rev stream names added to the zone from this device
          */
        streams: string[];
    }
    export type FlatZone = Omit<Zone, 'childZones'>;
}
