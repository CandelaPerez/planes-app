export default function PlacePhotoCredit({ plan }) {
  const photo = plan.photograph;
  const author = photo?.author === 'Yo mismo' ? `Yo mismo (Commons: ${photo.uploader})` : photo?.author;
  return <span data-photo-credit>{plan.imageKind === 'photograph' && photo
    ? <><a href={photo.sourceUrl} target="_blank" rel="noreferrer">Foto: {author}</a> · <a href={photo.licenseUrl} target="_blank" rel="noreferrer">{photo.license}</a></>
    : plan.imageKind === 'photograph'
      ? <a href={plan.imageSourceUrl} target="_blank" rel="noreferrer">Fotografía: fuente original</a>
      : 'Imagen ilustrativa; no es una fotografía del lugar.'}</span>;
}
