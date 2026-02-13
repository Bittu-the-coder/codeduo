export function load({ params }: { params: { id: string } }) {
	return {
		roomId: params.id
	};
}
