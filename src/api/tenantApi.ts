import apiClient from './apiClient';

export interface TenantData {
    id: string;
    name: string;
    slug: string;
    themeConfig: {
        primaryColor: string;
        secondaryColor: string;
        accentColor: string;
        fontFamily: string;
    };
};



export const tenantSearch = async (slug: string): Promise<TenantData> => {
    const response = await apiClient.get(
        `/tenants/search?slug=${slug.toLowerCase().trim()}`,
    );
    return response.data.data;
};


export const tenantCreate = async (name: string, slug: string): Promise<TenantData> => {
    console.log("Creating organization...", name, slug);
    const response = await apiClient.post("/tenants", {
        name: name.trim(),
        slug: slug.toLowerCase().trim(),
        themeConfig: {
            primaryColor: "#3b82f6",
            secondaryColor: "#10b981",
            accentColor: "#f59e0b",
            fontFamily: "Inter",
        },
    });

    return response.data.data;
};

