import React, { useEffect, useState } from 'react';
import ImageUpload from '@/components/ImageUpload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Trash2, Clipboard, Check, Image as ImageIcon } from 'lucide-react';

interface UploadedImage {
	filename: string;
	path: string;
	size: number;
}

const ImagesPage: React.FC = () => {
	const [images, setImages] = useState<UploadedImage[]>([]);
	const [copying, setCopying] = useState<string | null>(null);
	const { toast } = useToast();

	const fetchImages = async () => {
		try {
			const res = await fetch('/api/images');
			const data = await res.json();
			setImages(data.images || []);
		} catch (error) {
			console.error('Error fetching images', error);
		}
	};

	useEffect(() => {
		fetchImages();
	}, []);

	const handleUploaded = () => {
		fetchImages();
		toast({ title: 'Imagen subida', description: 'La imagen fue subida correctamente.' });
	};

	const handleCopy = async (text: string, id: string) => {
		try {
			setCopying(id);
			await navigator.clipboard.writeText(text);
			toast({ title: 'Copiado', description: 'Ruta copiada al portapapeles.' });
		} catch (e) {
			console.error(e);
		} finally {
			setTimeout(() => setCopying(null), 700);
		}
	};

	const handleDelete = async (filename: string) => {
		try {
			const res = await fetch(`/api/images/${encodeURIComponent(filename)}`, { method: 'DELETE' });
			if (!res.ok) throw new Error('Error al eliminar');
			toast({ title: 'Eliminada', description: 'La imagen fue eliminada.' });
			fetchImages();
		} catch (e) {
			toast({ title: 'Error', description: 'No se pudo eliminar la imagen.', variant: 'destructive' });
		}
	};

	const setAsTopLeft = (path: string) => {
		localStorage.setItem('stebe-top-left-image', path);
		toast({ title: 'Actualizado', description: 'Imagen establecida como icono superior.' });
	};

	return (
		<div className="min-h-screen bg-gray-50 p-4">
			<div className="max-w-4xl mx-auto space-y-6">
				<div className="flex items-center justify-between">
					<h1 className="text-2xl font-semibold">Gestor de Imágenes</h1>
					<a href="/" className="text-sm text-blue-600 underline">Volver</a>
				</div>

				<ImageUpload onImageUploaded={handleUploaded} />

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2"><ImageIcon className="w-5 h-5" /> Imágenes subidas</CardTitle>
					</CardHeader>
					<CardContent>
						{images.length === 0 ? (
							<p className="text-sm text-gray-600">No hay imágenes aún.</p>
						) : (
							<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
								{images.map((img) => (
									<div key={img.filename} className="border rounded-lg overflow-hidden bg-white">
										<div className="w-full h-32 bg-gray-100 flex items-center justify-center">
											<img src={img.path} alt={img.filename} className="max-w-full max-h-full object-contain" />
										</div>
										<div className="p-2 space-y-2">
											<p className="text-xs break-all">{img.filename}</p>
											<div className="flex gap-2">
												<Button size="sm" variant="secondary" onClick={() => handleCopy(img.path, img.filename)}>
													{copying === img.filename ? <Check className="w-4 h-4" /> : <Clipboard className="w-4 h-4" />}
												</Button>
												<Button size="sm" variant="secondary" onClick={() => setAsTopLeft(img.path)}>Superior</Button>
												<Button size="sm" variant="destructive" onClick={() => handleDelete(img.filename)}>
													<Trash2 className="w-4 h-4" />
												</Button>
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
};

export default ImagesPage;