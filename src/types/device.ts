import { LiteralString } from './rev';
import { Video } from './video';

/** @category Devices */
export namespace Device {
    export type DeviceType = 'Dme' | 'Akamai' | 'AkamaiLive' | 'Custom' | 'Encoder' /*|'LdapConnector'*/;

    export type HealthStatusType = 'Uninitialized' | 'Initializing' | 'Healthy' | 'Warning' | 'Error' | 'Updating' | 'Normal' | 'Caution' | 'Alert';

    export interface VideoStream {
        name: string;
        url: string;
        encodingType: Video.EncodingType;
        isMulticast: boolean;
        isVbrickMulticast: boolean;
    }

    export interface ZoneDevice {
        deviceType: DeviceType;
        id: string;
        name: string;
        healthStatus: HealthStatusType;
        isVideoStorageDevice?: boolean;
        macAddresses?: string[];
        prepositionContent?: boolean;
        videoStreams?: VideoStream[];
    }

    export interface PresentationProfile {
        id: string;
        name: string;
        description: string;
        status: "Active" | "InActive";
        videoSource: string;
        destinations?: {
            deviceId: string;
            deviceName: string;
            type: string;
            isActive: boolean;
            streams: string[];
        }[];
    }

    export interface DmeDetails {
        name: string;
        id: string;
        macAddress: string;
        status: string;
        prepositionContent: boolean;
        isVideoStorageDevice: boolean;
        dmeStatus: DmeHealthStatus;
        ipAddress: string;
    }
    export interface CreateDMERequest {
        /**
         * DME device name
         */
        name: string;
        /**
         * MAC address for the DME. Must be unique to the Rev account.
         */
        macAddress: string;
        /**
         * Default=false. Specifies if the DME is currently active.
         */
        isActive?: boolean;
        /**
         * Default=false. Specifies if the DME should preposition content.
         */
        prepositionContent?: boolean;
        /**
         * Default=false. Specifies the DME as a storage device.
         */
        isVideoStorageDevice?: boolean;
        /* Used to manually add video streams to the DME. */
        manualVideoStreams?: DmeVideoStream[];
        /* Used to add an HLS stream, required for mobile devices.  This is not added by default. */
        VideoStreamGroupsToAdd?: DmeVideoStreamGroup[];
    }

    /**
     * @inline
     * Used to manually add video streams to the DME.
     */
    interface DmeVideoStream {
        /**
         * Descriptive name for the stream
         */
        name: string;
        /**
         * URL of the stream
         */
        url: string;
        /**
         * Encoding type of the stream.  Values can be [h264, hls, hds, h264ts, mpeg4, mpeg2, wm]
         */
        encodingType?: LiteralString<Video.EncodingType>;
        /**
         * Specifies if the stream is a multicast stream
         */
        isMulticast?: boolean;
    }
    /**
     * @inline
     * Used to add an HLS stream, required for mobile devices.  This is not added by default.
     */
    interface DmeVideoStreamGroup {
        /**
         * Stream name
         */
        name: string;
        /**
         * Specify if an HLS stream is created
         */
        hasHls: boolean;
    }

    /** @inline */
    interface OriginStats {
        segmentsFailed: number;
        playlistsFailed: number;
        playlistsReceived: number;
        segmentsReceived: number;
    }

    /**
     * @inline
     * @ignore
     */
    type HealthEnum = "Uninitialized" | "Normal" | "Caution" | "Alert";

    /** @inline */
    interface MeshStatistics {
        clientHttpRequests?: number;
        clientHttpHits?: number;
        clientHttpErrors?: number;
        clientHttpKbitsIn?: number;
        clientHttpKbitsOut?: number;
        clientHttpAllMedianSvcTime?: number;
        clientHttpMissMedianSvcTime?: number;
        serverAllRequests?: number;
        serverAllErrors?: number;
        serverAllKbitsIn?: number;
        serverAllKbitsOut?: number;
        serverHttpRequests?: number;
        serverHttpErrors?: number;
        serverHttpKbitsIn?: number;
        serverHttpKbitsOut?: number;
        cpuTime?: number;
        hitsPercentageAllRequests?: number;
        hitsPercentageBitsSent?: number;
        memoryHitsPercentageHitRequests?: number;
        diskHitsPercentageHitRequests?: number;
        storageSwapSize?: number;
        storageSwapPercentageUsed?: number;
        storageMemSize?: number;
        storageMemPercentageUsed?: number;
        cacheMissesRatio?: number;
        cacheHits?: number;
        squidCpuUsage?: number;
    }

    /** @inline */
    interface HLSDistribution {
        streamId: string;
        streamName: string;
        mediaId: string;
        mediaName: string;
        mediaSource: string;
        mediaSourceType: string;
        status: string;
        statusDetail: string;
        sourceUrl: string;
        playlistsReceived: number;
        segmentsReceived: number;
        eventPlaylistReceived: number;
        eventSegmentsReceived: number;
        eventPlaylistFetchErrors: number;
        eventSegmentFetchErrors: number;
        streamReconnects: number;
        enableMulticast: boolean;
        enableReflection: boolean;
        automaticMulticast: "HighBitrate" | "LowBitrate";
        eventStarted: string; // date-time
    }

    /** @inline */
    interface DmeRecordingStatus {
        id: string;
        streamName: string;
        startDate: string; // date-time
        duration: string;
        status: string;
    }

    /** @inline */
    interface DmeServiceStatus {
        name: string;
        active: string;
        state: string;
        stateStartTime: string;
        memory: number;
    }

    /** @inline */
    interface EnrichedStreamStatus {
        typeNumeric?: number;
        stateStartTime?: number;
        inputStream?: string;
        totalPktsTx?: number;
        status?: string;
        totalEventTime?: number;
        mediaId?: string;
        mediaName?: string;
        packetsOk?: number;
        totalPktsDropped?: number;
        enrichmentType?: string;
        endTime?: string;
        url?: string;
        startTime?: string;
        reconnectAttempts?: number;
        typeVerbose?: string;
        packetsDropped?: number;
        name?: string;
        duration?: number;
        timeInCurrentState?: number;
        enrichmentRequestId?: string;
        connectionHistory?: {
            packetsDropped?: number;
            packetsTx?: number;
            connectionStartTime?: number;
            connectionEndTime?: number;
        }[];
    }

    /** @inline */
    interface PassthroughStreamStatus {
        reflectionData?: {
            playbackUrlPaths: {
                type: string;
                path: string;
            }[];
        };
        eventConfig?: {
            duration: number;
            mediaId: string;
            mediaSourceType: string;
            enableReflection: boolean;
            mediaName: string;
            autoMulticastConfig?: {
                packetSize: number;
                address: string;
                port: number;
                rendition: string;
            };
            enableMulticast: boolean;
            sourceUrl: string;
            streamName: string;
            streamId: string;
            mediaSource: string;
        };
        multicastPushData?: {
            rates: {
                bitrate: number;
                segmentsSent: number;
                state: string;
                playlistsSent: number;
                playbackUrl: string;
            }[];
        };
        type: string;
        originData: {
            sourceUrls?: {
                url: string;
                type: string;
            }[];
            currentStatus?: {
                stateStartTime: number;
                stateElapsedTime: number;
                state: string;
                eventElapsedTime: number;
                statsEventTotal: OriginStats;
                statsWindowed: OriginStats;
                eventStartTime: number;
                statsStateTotal: OriginStats;
            };
        };
    }

    /** @inline */
    interface HLSStreamStatus {
        masterStatus: string;
        cdn?: {
            isActive: number;
            pushUrl: string;
        };
        subStreams?: {
            url: string;
            name: string;
        }[];
        masterUrl?: string;
        groupName?: string;
        isMasterSub?: number;
    }

    /** @inline */
    interface MPSStreamStatus {
        status: string;
        packetsDropped: number;
        name: string;
        packetsOk: number;
        uptime: number;
        type: string;
        farIp: string;
        farPort: number;
        nearPort: number;
    }

    /** @inline */
    export interface DmeHealthStatus {
        bootTime?: string; // date-time
        systemTime?: string; // date-time
        systemVersion?: string;
        fullVersion?: string;
        ipAddress?: string;
        natAddress?: string;
        hostname?: string;
        overallHealth?: HealthEnum;

        cpuUsagePercent?: number;
        cpuUsageHealth?: HealthEnum;

        rtmpServerVersion?: string;
        rtspCpuUsagePercent?: number;
        rtmpCpuUsagePercent?: number;
        mpsConnectionCount?: number;
        mpsThroughputBitsPerSec?: number;
        mpsThroughputPercent?: number;
        throughputHealth?: HealthEnum;

        multiProtocolIncomingConnectionsCount?: number;
        multiProtocolOutgoingConnectionsCount?: number;
        mpsMulticastStreamCount?: number;
        multiProtocolMaxCount?: number;
        rtpIncomingConnectionsCount?: number;
        rtpOutgoingConnectionsCount?: number;
        rtpMulticastConnectionsCount?: number;
        rtpConnectionsMaxCount?: number;
        iScsiEnabled?: boolean;

        diskContentTotal?: number;
        diskContentUsed?: number;
        diskContentHealth?: HealthEnum;
        diskSystemTotal?: number;
        diskSystemUsed?: number;
        diskSystemHealth?: HealthEnum;

        physicalMemoryTotal?: number;
        physicalMemoryUsed?: number;
        swapMemoryUsed?: number;
        swapMemoryTotal?: number;
        memoryHealth?: HealthEnum;

        meshPeerTotalCount?: number;
        meshPeerReachableCount?: number;
        meshHealth?: HealthEnum;

        transratingActiveCount?: number;
        transratingMaxCount?: number;
        recordings?: DmeRecordingStatus[];

        sslMediaTransfer?: string;
        stbConnectorEnabled?: boolean;

        httpThroughputBitsPerSec: number;
        httpConnectionCount: number;
        throughputPhysicalBits: number;

        meshStatistics?: MeshStatistics;

        lockdownStatus: "Disabled" | "Unsupported" | "Locking" | "Enabled" | "Unlocking" | "Error";
        lockdownStatusDetail?: string;

        hlsDistributions?: HLSDistribution[];
        serviceStatus?: {
            servicesHealth: string;
            services?: DmeServiceStatus[];
        };
        numWorkers?: number;
        workers?: { workerNum: number; numRequests: number; hitsPercentage: number; restarts: number; }[];
        streamStatus?: {
            mpsStreams: MPSStreamStatus[];
            hlsStreams?: HLSStreamStatus[];
            passthroughStreams?: PassthroughStreamStatus[];
            enrichedStreams?: EnrichedStreamStatus[];
        };
    }

}
