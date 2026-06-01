import { useParams } from 'react-router-dom';

export function ProjectDetail() {
  const { slug } = useParams<{ slug: string }>();

  return <h1 className="text-green-300">{slug}</h1>;
}

export default ProjectDetail;
