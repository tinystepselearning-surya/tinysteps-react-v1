import React, { useEffect, useState } from 'react';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../../lib/firebaseConfig';

interface TicketsListProps {
  lpId?: string;
}

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdBy: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

export const TicketsList: React.FC<TicketsListProps> = ({ lpId }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const ticketsQuery = query(
          collection(db, 'tickets'),
          where('lpId', '==', lpId || null)
        );
        const querySnapshot = await getDocs(ticketsQuery);
        const fetchedTickets: Ticket[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Ticket[];
        setTickets(fetchedTickets);
      } catch (error) {
        console.error('Error fetching tickets:', error);
      }
    };

    fetchTickets();
  }, [lpId]);

  const getStatusColor = (status: Ticket['status']) => {
    switch (status) {
      case 'open': return 'destructive';
      case 'in_progress': return 'default';
      case 'resolved': return 'secondary';
      case 'closed': return 'outline';
      default: return 'secondary';
    }
  };

  const getPriorityColor = (priority: Ticket['priority']) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'orange';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Support Tickets</h2>
        <Button>Create Ticket</Button>
      </div>

      <div className="grid gap-4">
        {tickets.map((ticket) => (
          <Card key={ticket.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold">{ticket.title}</h3>
                  <Badge variant={getStatusColor(ticket.status)}>
                    {ticket.status.replace('_', ' ')}
                  </Badge>
                  <Badge variant="outline" className={`text-${getPriorityColor(ticket.priority)}-600`}>
                    {ticket.priority}
                  </Badge>
                </div>
                <p className="text-muted-foreground">{ticket.description}</p>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>By: {ticket.createdBy}</span>
                  <span>Created: {ticket.createdAt}</span>
                  {ticket.assignedTo && <span>Assigned: {ticket.assignedTo}</span>}
                </div>
              </div>

              <div className="flex gap-2 ml-4">
                <Button variant="outline" size="sm">
                  View Details
                </Button>
                {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                  <Button variant="outline" size="sm">
                    Update
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TicketsList;