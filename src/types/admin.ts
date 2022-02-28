
export namespace Admin {
    export interface CustomField {
        id: string;
        name: string;
        value: any;
        required: boolean;
        displayedToUsers: boolean;
        type: string;
        fieldType: string;
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
        usage: string;
        credits: number;
        languages: string[];
        when: string;
    }
}
