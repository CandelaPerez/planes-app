export default function PlacePhotoCredit({ plan }) {
  const photo = plan.photograph;
  const photoDate = photo?.photoDate?.match(/^\d{4}(?:-\d{2}-\d{2})?/)?.[0] || photo?.photoDate;
  const author = photo?.author === 'Yo mismo' ? `Yo mismo (Commons: ${photo.uploader})` : photo?.author;
  return <span data-photo-credit>{plan.imageKind === 'photograph' && photo
    ? <><a href={photo.sourceUrl} target="_blank" rel="noreferrer">Foto: {author}</a> · <a href={photo.licenseUrl} target="_blank" rel="noreferrer">{photo.license}</a>{photoDate && <> · Archivo: {photoDate}</>}</>
    : plan.imageKind === 'photograph'
      ? <a href={plan.imageSourceUrl} target="_blank" rel="noreferrer">Fotografía: fuente original</a>
      : 'Imagen ilustrativa; no es una fotografía del lugar.'}</span>;
}
