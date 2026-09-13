import { Incident } from '../db/models.js';

export interface ScenarioPreset {
  id: string;
  name: string;
  category: string;
  icon: string;
  incident: Incident;
  suggestedUpdates: Array<{
    title: string;
    text: string;
    type: 'HAZARD_ESCALATION' | 'ACCESS_BLOCK' | 'CASUALTY_UPDATE' | 'WEATHER_CHANGE';
  }>;
}

export const SCENARIOS: ScenarioPreset[] = [
  {
    id: 'highway-accident',
    name: 'Highway Multi-Vehicle Collision (Flagship Demo)',
    category: 'Transportation & Trauma',
    icon: 'CarCrash',
    incident: {
      incidentId: 'RG-2026-0001',
      title: 'Three-Vehicle Highway Collision with Entrapment & Smoking Engine',
      type: 'Multi-Vehicle Collision',
      location: {
        address: 'Interstate 80 Westbound, Mile Marker 44',
        lat: 37.7833,
        lng: -122.4167,
        zone: 'Sector 8 Highway Corridor'
      },
      description:
        'Three vehicles have collided on a highway. Six people are reported to be involved. Two people may have serious injuries. One vehicle is smoking and the highway is partially blocked.',
      severity: 'HIGH',
      affectedPeople: 6,
      hazards: [
        'Smoking engine compartment with hydrocarbon combustion hazard',
        'Partial highway lane blockage causing severe traffic bottleneck',
        'Possible entrapment in deformed sedan driver compartment'
      ],
      status: 'REPORTED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    suggestedUpdates: [
      {
        title: 'Fire & Hard Road Closure (Flagship Step 9)',
        text: 'Fire is now reported in one vehicle and the primary access lane is blocked.',
        type: 'HAZARD_ESCALATION'
      },
      {
        title: 'Inclement Weather & Fuel Spill',
        text: 'Heavy rain has started and fuel leakage has ignited on the right shoulder.',
        type: 'WEATHER_CHANGE'
      },
      {
        title: 'Casualty Count Escalation',
        text: 'Two additional injured people have been reported trapped in the third vehicle.',
        type: 'CASUALTY_UPDATE'
      },
      {
        title: 'Police Roadblock Confirmation',
        text: 'Confirmed. Police have completely blocked the highway at Exit 14. All traffic diverted.',
        type: 'ACCESS_BLOCK'
      }
    ]
  },
  {
    id: 'building-fire',
    name: 'Commercial Structure Fire & Entrapment',
    category: 'Structural Fire',
    icon: 'Flame',
    incident: {
      incidentId: 'RG-2026-0002',
      title: '4-Story Commercial Complex 2nd Floor Active Fire',
      type: 'Structural Fire',
      location: {
        address: '742 Montgomery St, Financial District',
        lat: 37.7952,
        lng: -122.4029,
        zone: 'Downtown Commercial Sector'
      },
      description:
        'Commercial 4-story building reporting fire on 2nd floor with thick smoke. Occupants evacuating, 12 people unaccounted for on upper levels.',
      severity: 'CRITICAL',
      affectedPeople: 12,
      hazards: [
        'Rapid vertical smoke propagation via HVAC shafts',
        'Structural roof compromise potential',
        'Narrow urban street access restricting ladder truck deployment'
      ],
      status: 'REPORTED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    suggestedUpdates: [
      {
        title: 'Roof Trap Notification',
        text: 'Five occupants confirmed trapped on 4th floor roof; heavy smoke obstructing stairwells.',
        type: 'CASUALTY_UPDATE'
      },
      {
        title: 'Hydrant Pressure Drop',
        text: 'Municipal water pressure drop detected on Montgomery St; secondary tanker relay requested.',
        type: 'HAZARD_ESCALATION'
      }
    ]
  },
  {
    id: 'urban-flood',
    name: 'Flash Flood & River Overflow Emergency',
    category: 'Natural Disaster',
    icon: 'Waves',
    incident: {
      incidentId: 'RG-2026-0003',
      title: 'Flash Flood Inundation & Stranded Vehicles',
      type: 'Flash Flood',
      location: {
        address: 'Creek Road & Valley Boulevard Junction',
        lat: 37.765,
        lng: -122.44,
        zone: 'Lowland Valley Basin'
      },
      description:
        'Severe downpour caused river overflow in Sector 4. Multiple vehicles stranded in 3-foot rising water, residential basements flooding.',
      severity: 'HIGH',
      affectedPeople: 18,
      hazards: [
        'Rapid swift-water current washing across roadway',
        'Submerged electrical utility junction box',
        'Hypothermia hazard in stagnant flood waters'
      ],
      status: 'REPORTED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    suggestedUpdates: [
      {
        title: 'Swift Water Boat Deployment',
        text: 'Water levels rising 6 inches every 15 minutes; swift-water rescue boats needed immediately.',
        type: 'HAZARD_ESCALATION'
      },
      {
        title: 'Bridge Structural Scour',
        text: 'Civil engineering team reports scour damage on Valley Bridge; bridge closed to all vehicles.',
        type: 'ACCESS_BLOCK'
      }
    ]
  },
  {
    id: 'train-collision',
    name: 'Commuter Train Collision at Crossing',
    category: 'Mass Transit',
    icon: 'Train',
    incident: {
      incidentId: 'RG-2026-0004',
      title: 'Commuter Train Impact with Freight Truck at Grade Crossing',
      type: 'Train Derailment',
      location: {
        address: 'County Road 12 Grade Crossing',
        lat: 37.74,
        lng: -122.39,
        zone: 'Transit Corridor East'
      },
      description:
        'Commuter passenger train collided with freight truck at rural railway crossing. 2 passenger cars derailed, power lines down.',
      severity: 'CRITICAL',
      affectedPeople: 45,
      hazards: [
        'Downed 25kV catenary overhead electrical lines touching railcars',
        'Diesel fuel spill from locomotive fuel cell',
        'Mass casualty triage requirement'
      ],
      status: 'REPORTED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    suggestedUpdates: [
      {
        title: 'Power Grid De-energized',
        text: 'Transit dispatch confirms 25kV catenary power grid de-energized and grounded.',
        type: 'HAZARD_ESCALATION'
      },
      {
        title: 'Helicopter Landing Zone',
        text: 'Designated Helicopter Landing Zone (LZ) established in adjacent agricultural field.',
        type: 'ACCESS_BLOCK'
      }
    ]
  },
  {
    id: 'stadium-evacuation',
    name: 'Large Event Stadium Explosion & Crowd Surge',
    category: 'Public Safety',
    icon: 'Users',
    incident: {
      incidentId: 'RG-2026-0005',
      title: 'Transformer Explosion Outside Stadium Gate with Crowd Surge',
      type: 'Mass Gathering Emergency',
      location: {
        address: 'Grand Arena West Gate, Sports Complex',
        lat: 37.77,
        lng: -122.388,
        zone: 'Arena District'
      },
      description:
        'Electrical transformer explosion outside West Gate during festival. Crowd surge, minor injuries, exits congested.',
      severity: 'MEDIUM',
      affectedPeople: 30,
      hazards: [
        'Crowd crush pressure at bottleneck exits',
        'Electrical arc hazard at exterior transformer substation',
        'Civilian panic and separated families'
      ],
      status: 'REPORTED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    suggestedUpdates: [
      {
        title: 'Emergency Broadcast Active',
        text: 'Stadium PA system broadcasting calm evacuation guidance toward North and East gates.',
        type: 'CASUALTY_UPDATE'
      }
    ]
  }
];
