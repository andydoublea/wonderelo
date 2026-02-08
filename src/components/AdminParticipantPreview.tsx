import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { ArrowLeft, Eye, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Separator } from './ui/separator';
import { toast } from 'sonner@2.0.3';
import { ParticipantPreviewMock } from './ParticipantPreviewMock';

interface Scenario {
  id: string;
  name: string;
  description: string;
  mockData: any;
}

const scenarios: Scenario[] = [
  {
    id: 'no-match',
    name: 'No match yet',
    description: 'Participant is registered and confirmed, but matching hasn\'t happened yet',
    mockData: {
      participantStatus: 'confirmed',
      matchData: null
    }
  },
  {
    id: 'waiting-match',
    name: 'Waiting for match',
    description: 'T-0 has passed, matching is in progress',
    mockData: {
      participantStatus: 'waiting-for-match',
      matchData: null
    }
  },
  {
    id: 'matched-1v1',
    name: 'Matched 1v1',
    description: 'Participant matched with one other person',
    mockData: {
      participantStatus: 'matched',
      matchData: {
        match: {
          id: 'match-1',
          roundId: 'round-1',
          participantIds: ['participant-1', 'participant-2'],
          meetingPoint: 'Main entrance',
          identificationImage: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&h=400&fit=crop',
          checkIns: [],
          participants: [
            {
              id: 'participant-1',
              firstName: 'Jan',
              lastName: 'Novák',
              email: 'jan.novak@example.com'
            },
            {
              id: 'participant-2',
              firstName: 'Petra',
              lastName: 'Horváthová',
              email: 'petra.horvathova@example.com'
            }
          ]
        }
      }
    }
  },
  {
    id: 'matched-group-3',
    name: 'Matched in group of 3',
    description: 'Participant matched with 2 other people',
    mockData: {
      participantStatus: 'matched',
      matchData: {
        match: {
          id: 'match-2',
          roundId: 'round-1',
          participantIds: ['participant-1', 'participant-2', 'participant-3'],
          meetingPoint: 'Coffee corner',
          identificationImage: 'https://images.unsplash.com/photo-1551818255-e6e10975bc17?w=400&h=400&fit=crop',
          checkIns: [],
          participants: [
            {
              id: 'participant-1',
              firstName: 'Martin',
              lastName: 'Kováč',
              email: 'martin.kovac@example.com'
            },
            {
              id: 'participant-2',
              firstName: 'Anna',
              lastName: 'Slobodová',
              email: 'anna.slobodova@example.com'
            },
            {
              id: 'participant-3',
              firstName: 'Tomáš',
              lastName: 'Dvořák',
              email: 'tomas.dvorak@example.com'
            }
          ]
        }
      }
    }
  },
  {
    id: 'matched-group-4',
    name: 'Matched in group of 4',
    description: 'Participant matched with 3 other people',
    mockData: {
      participantStatus: 'matched',
      matchData: {
        match: {
          id: 'match-3',
          roundId: 'round-1',
          participantIds: ['participant-1', 'participant-2', 'participant-3', 'participant-4'],
          meetingPoint: 'Conference room A',
          identificationImage: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400&h=400&fit=crop',
          checkIns: [],
          participants: [
            {
              id: 'participant-1',
              firstName: 'Lucia',
              lastName: 'Molnárová',
              email: 'lucia.molnarova@example.com'
            },
            {
              id: 'participant-2',
              firstName: 'Michal',
              lastName: 'Varga',
              email: 'michal.varga@example.com'
            },
            {
              id: 'participant-3',
              firstName: 'Eva',
              lastName: 'Baláž',
              email: 'eva.balaz@example.com'
            },
            {
              id: 'participant-4',
              firstName: 'Peter',
              lastName: 'Tóth',
              email: 'peter.toth@example.com'
            }
          ]
        }
      }
    }
  },
  {
    id: 'walking-to-meeting',
    name: 'Walking to meeting point',
    description: 'Participant is matched and heading to meeting point',
    mockData: {
      participantStatus: 'walking-to-meeting-point',
      matchData: {
        match: {
          id: 'match-4',
          roundId: 'round-1',
          participantIds: ['participant-1', 'participant-2'],
          meetingPoint: 'Reception desk',
          identificationImage: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=400&h=400&fit=crop',
          checkIns: [],
          participants: [
            {
              id: 'participant-1',
              firstName: 'Zuzana',
              lastName: 'Králiková',
              email: 'zuzana.kralikova@example.com'
            },
            {
              id: 'participant-2',
              firstName: 'Filip',
              lastName: 'Šimko',
              email: 'filip.simko@example.com'
            }
          ]
        }
      }
    }
  },
  {
    id: 'partially-checked-in',
    name: 'Partially checked in',
    description: 'Some participants already checked in at meeting point',
    mockData: {
      participantStatus: 'walking-to-meeting-point',
      matchData: {
        match: {
          id: 'match-5',
          roundId: 'round-1',
          participantIds: ['participant-1', 'participant-2', 'participant-3'],
          meetingPoint: 'Main lobby',
          identificationImage: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=400&fit=crop',
          checkIns: [
            {
              participantId: 'participant-2',
              checkedInAt: new Date(Date.now() - 120000).toISOString()
            }
          ],
          participants: [
            {
              id: 'participant-1',
              firstName: 'Kristína',
              lastName: 'Zemanová',
              email: 'kristina.zemanova@example.com'
            },
            {
              id: 'participant-2',
              firstName: 'Marek',
              lastName: 'Bednár',
              email: 'marek.bednar@example.com'
            },
            {
              id: 'participant-3',
              firstName: 'Simona',
              lastName: 'Krajčová',
              email: 'simona.krajcova@example.com'
            }
          ]
        }
      }
    }
  },
  {
    id: 'all-checked-in',
    name: 'All checked in',
    description: 'All participants checked in, networking in progress',
    mockData: {
      participantStatus: 'waiting-for-meet-confirmation',
      matchData: {
        match: {
          id: 'match-6',
          roundId: 'round-1',
          participantIds: ['participant-1', 'participant-2', 'participant-3'],
          meetingPoint: 'Cafeteria',
          identificationImage: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=400&h=400&fit=crop',
          checkIns: [
            {
              participantId: 'participant-1',
              checkedInAt: new Date(Date.now() - 300000).toISOString()
            },
            {
              participantId: 'participant-2',
              checkedInAt: new Date(Date.now() - 240000).toISOString()
            },
            {
              participantId: 'participant-3',
              checkedInAt: new Date(Date.now() - 180000).toISOString()
            }
          ],
          participants: [
            {
              id: 'participant-1',
              firstName: 'David',
              lastName: 'Pavlík',
              email: 'david.pavlik@example.com'
            },
            {
              id: 'participant-2',
              firstName: 'Nikola',
              lastName: 'Szabó',
              email: 'nikola.szabo@example.com'
            },
            {
              id: 'participant-3',
              firstName: 'Matúš',
              lastName: 'Lukáč',
              email: 'matus.lukac@example.com'
            }
          ]
        }
      }
    }
  },
  {
    id: 'met-confirmed',
    name: 'Meeting confirmed',
    description: 'Round completed, meeting confirmed by participant',
    mockData: {
      participantStatus: 'met',
      matchData: {
        match: {
          id: 'match-7',
          roundId: 'round-1',
          participantIds: ['participant-1', 'participant-2'],
          meetingPoint: 'Terrace',
          identificationImage: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=400&h=400&fit=crop',
          checkIns: [
            {
              participantId: 'participant-1',
              checkedInAt: new Date(Date.now() - 1800000).toISOString()
            },
            {
              participantId: 'participant-2',
              checkedInAt: new Date(Date.now() - 1740000).toISOString()
            }
          ],
          participants: [
            {
              id: 'participant-1',
              firstName: 'Andrea',
              lastName: 'Baranová',
              email: 'andrea.baranova@example.com'
            },
            {
              id: 'participant-2',
              firstName: 'Jakub',
              lastName: 'Čech',
              email: 'jakub.cech@example.com'
            }
          ]
        }
      }
    }
  }
];

export function AdminParticipantPreview() {
  const navigate = useNavigate();
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [participantToken, setParticipantToken] = useState<string>('');
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [selectedView, setSelectedView] = useState<'dashboard' | 'match-info'>('dashboard');

  const handleEnablePreview = () => {
    if (!selectedScenario) {
      toast.error('Please select a scenario first');
      return;
    }

    setShowPreview(true);
    toast.success('Preview loaded');
  };

  const handleReset = () => {
    setSelectedScenario('');
    setParticipantToken('');
    setShowPreview(false);
  };

  const selectedScenarioData = scenarios.find(s => s.id === selectedScenario);
  const previewToken = selectedScenario ? `PREVIEW_${selectedScenario}` : '';

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to admin
        </Button>
        
        <div>
          <h1 className="text-3xl font-bold">Participant preview tool</h1>
          <p className="text-muted-foreground mt-1">
            Preview participant dashboard in different match scenarios
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="participant-token">Participant token (optional)</Label>
              <Input
                id="participant-token"
                placeholder="Enter participant token to preview real data"
                value={participantToken}
                onChange={(e) => setParticipantToken(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use mock participant data
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="scenario">Select scenario</Label>
              <Select value={selectedScenario} onValueChange={setSelectedScenario}>
                <SelectTrigger id="scenario">
                  <SelectValue placeholder="Choose a scenario" />
                </SelectTrigger>
                <SelectContent>
                  {scenarios.map((scenario) => (
                    <SelectItem key={scenario.id} value={scenario.id}>
                      {scenario.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedScenarioData && (
                <div className="p-3 bg-muted rounded-md mt-2">
                  <p className="text-sm font-medium">{selectedScenarioData.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedScenarioData.description}
                  </p>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="view">Select view</Label>
              <Select value={selectedView} onValueChange={(value: 'dashboard' | 'match-info') => setSelectedView(value)}>
                <SelectTrigger id="view">
                  <SelectValue placeholder="Choose a view" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dashboard">Participant Dashboard</SelectItem>
                  <SelectItem value="match-info">Match Info Page</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {selectedView === 'dashboard' 
                  ? 'Shows the main participant dashboard with all rounds' 
                  : 'Shows the Match Info page (only available for matched scenarios)'}
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleEnablePreview} 
                className="flex-1"
                disabled={!selectedScenario}
              >
                <Eye className="mr-2 h-4 w-4" />
                {showPreview ? 'Refresh preview' : 'Open preview'}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleReset}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Scenario List */}
        <Card>
          <CardHeader>
            <CardTitle>Available scenarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {scenarios.map((scenario) => (
                <div
                  key={scenario.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedScenario === scenario.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedScenario(scenario.id)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{scenario.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {scenario.description}
                      </p>
                    </div>
                    {selectedScenario === scenario.id && (
                      <Badge variant="default" className="ml-2">Selected</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Section */}
      {showPreview && selectedScenarioData && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Preview: {selectedScenarioData.name}</CardTitle>
              <Badge variant="secondary">Live Preview</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="border-t">
              <ParticipantPreviewMock
                mockData={selectedScenarioData.mockData}
                scenarioName={selectedScenarioData.name}
                view={selectedView}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}