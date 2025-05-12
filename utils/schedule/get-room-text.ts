export function getRoomText(
  session: {
    type: string;
    rooms: { name: string; type: string }[];
  },
  rooms?: { name: string; type: string }[],
) {
  if (!rooms) {
    return null;
  }

  if (session.type === 'break') {
    return null;
  }

  if (session.type === 'keynote') {
    return 'All rooms';
  }

  if (session.rooms.length === (rooms?.length ?? 0)) {
    return 'All rooms';
  }

  if (
    session.rooms.length ===
    rooms.filter((room) => room.type !== 'training').length
  ) {
    console.log('all rooms training');
    return 'All rooms';
  }

  return session.rooms.map((room) => room.name).join(', ');
}
