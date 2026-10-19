export type ListingSize={label:string;areaSqFt?:number;feasible:boolean;Silver:number;Gold:number;Black:number;wooden:number;led:number;install:number}
export type ListingVariant={design_code:number;pricing:{sizes:ListingSize[]};dxf_storage_path?:string}
export type ListingDraft={id?:string;revision?:number;title:string;slug:string;description:string;category:string;status:string;images:string[];variants:ListingVariant[]}
export type ListingSummary=ListingDraft&{id:string;revision:number;price?:string;designCount?:number}
export type ListingSource={list:()=>Promise<ListingSummary[]>;get:(id:string)=>Promise<ListingDraft>;save:(listing:ListingDraft,expectedRevision:number)=>Promise<ListingDraft>}
