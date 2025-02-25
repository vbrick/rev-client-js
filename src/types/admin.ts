import type { API } from "../api/admin";
import { LiteralString } from "./rev";
import { Video } from './video';

/**
 * @category Administration
 */
export namespace Admin {

    export interface CustomField {
        id: string,
        name: string,
        value: string,
        required?: boolean
    }
    export namespace CustomField {
        export type Request =
            { id: string, name?: string, value: string }
            | { id?: string, name: string, value: string };

        // { id: string, name?: string, value: string } | { id?: string, name: string, value: string };
        export interface Detail {
            id: string;
            name: string;
            value: any;
            required: boolean;
            displayedToUsers: boolean;
            options: string[] | null;
            type: string;
            fieldType: string;
        }
    }

    export interface BrandingSettings {
        general?: {
            PrimaryColor?: string;
            PrimaryFontColor?: string;
            AccentColor?: string;
            AccentFontColor?: string;
            LogoUri?: string;
        };
        header?: {
            BackgroundColor?: string;
            FontColor?: string;
        };
    }

    export interface IQCreditsSession {
        resourceId: string;
        resourceType: string;
        title: string;
        duration: string;
        initiator: {
            userId: string;
            firstName: string;
            lastName: string;
            fullName: string;
            username: string;
        }
        creator: {
            userId: string;
            firstName: string;
            lastName: string;
            fullName: string;
            username: string;
        }
        usage: LiteralString<'Transcription' | 'Translation' | 'UserTagging' | 'MetadataGeneration' | 'AudioGeneration'>;
        credits: number;
        languages: string[];
        when: string;
    }
    export interface ExpirationRule {
        ruleId: string;
        ruleName: string;
        numberOfDays: number;
        expiryRuleType: Video.ExpiryRule;
        deleteOnExpiration: boolean;
        isDefault: boolean;
        description: string;
    }


    export interface FeatureSettings {
        categoriesEnabled: boolean;
        commentsEnabled: boolean;
        customFields: Array<{
            id: string;
            name: string;
            required: boolean;
            fieldType: LiteralString<'Text' | 'Select'>;
        }>;
        defaultSearchSort: string;
        downloadsEnabled: boolean;
        expirationRules: Array<{
            id: string;
            name: string;
            ruleType: Video.ExpiryRule;
            deleteOnExpire: boolean;
            isDefault: boolean;
            numberOfDays: number;
        }>;
        facialRecognitionEnabled: boolean;
        legalHoldEnabled: boolean;
        publicVideosEnabled: boolean;
        ratingsEnabled: boolean;
        revIQTranscriptionAndTranslationEnabled: boolean;
        supplementalFilesEnabled: boolean;
        tagsEnabled: boolean;
        unlistedEnabled: boolean;
        /** @deprecated */
        voiceBaseEnabled?: undefined;
    }
}
