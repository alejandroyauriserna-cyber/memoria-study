export type UserStickerRecord = {
  id: string;
  name: string;
  imageUrl: string;
  storagePath: string;
  createdAt: string;
  isFavorite: boolean;
};

export type CatalogFavoriteRef = {
  refType: "png";
  refId: string;
};
