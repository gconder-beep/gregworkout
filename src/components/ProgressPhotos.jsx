import { useRef } from 'react'

export default function ProgressPhotos({ photos, onChange }) {
  const input = useRef(null)

  const addPhoto = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 2_500_000) {
      alert('Please choose a photo smaller than 2.5 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const item = {
        id: crypto.randomUUID(),
        date: new Date().toISOString().slice(0, 10),
        label: prompt('Label this photo (front, side, back, or note):') || 'Progress photo',
        dataUrl: reader.result,
      }
      onChange([item, ...photos].slice(0, 12))
      event.target.value = ''
    }
    reader.readAsDataURL(file)
  }

  return (
    <section className="card">
      <div className="section-header">
        <div>
          <h2>Progress photos</h2>
          <p className="muted">Stored only on this device</p>
        </div>
        <button className="btn secondary" onClick={() => input.current?.click()}>Add photo</button>
      </div>
      <input ref={input} type="file" accept="image/*" hidden onChange={addPhoto} />
      {photos.length ? (
        <div className="photo-grid">
          {photos.map(photo => (
            <figure className="photo-card" key={photo.id}>
              <img src={photo.dataUrl} alt={photo.label} />
              <figcaption>
                <strong>{photo.label}</strong>
                <span>{photo.date}</span>
                <button onClick={() => onChange(photos.filter(p => p.id !== photo.id))}>Remove</button>
              </figcaption>
            </figure>
          ))}
        </div>
      ) : <p className="muted">No progress photos added yet.</p>}
    </section>
  )
}
