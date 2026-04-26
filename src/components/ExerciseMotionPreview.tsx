import type { ExerciseDemoKey } from '@/store/types';

type Point = [number, number];

interface Pose {
  head: Point;
  shoulder: Point;
  hip: Point;
  leftElbow: Point;
  rightElbow: Point;
  leftHand: Point;
  rightHand: Point;
  leftKnee: Point;
  rightKnee: Point;
  leftFoot: Point;
  rightFoot: Point;
}

interface MotionScene {
  from: Pose;
  to: Pose;
  floorY?: number;
}

const SCENES: Record<ExerciseDemoKey, MotionScene> = {
  push_up: {
    floorY: 136,
    from: {
      head: [188, 66],
      shoulder: [164, 76],
      hip: [112, 84],
      leftElbow: [186, 84],
      rightElbow: [174, 82],
      leftHand: [210, 98],
      rightHand: [198, 96],
      leftKnee: [76, 88],
      rightKnee: [70, 90],
      leftFoot: [30, 92],
      rightFoot: [38, 96],
    },
    to: {
      head: [186, 86],
      shoulder: [164, 96],
      hip: [114, 102],
      leftElbow: [182, 104],
      rightElbow: [170, 102],
      leftHand: [208, 108],
      rightHand: [196, 108],
      leftKnee: [78, 104],
      rightKnee: [72, 106],
      leftFoot: [30, 108],
      rightFoot: [38, 112],
    },
  },
  pike_push_up: {
    floorY: 138,
    from: {
      head: [174, 74],
      shoulder: [150, 86],
      hip: [110, 56],
      leftElbow: [178, 94],
      rightElbow: [158, 92],
      leftHand: [198, 112],
      rightHand: [176, 112],
      leftKnee: [88, 96],
      rightKnee: [82, 98],
      leftFoot: [62, 132],
      rightFoot: [82, 132],
    },
    to: {
      head: [166, 102],
      shoulder: [146, 106],
      hip: [110, 62],
      leftElbow: [168, 112],
      rightElbow: [150, 112],
      leftHand: [192, 120],
      rightHand: [170, 120],
      leftKnee: [88, 98],
      rightKnee: [82, 100],
      leftFoot: [62, 132],
      rightFoot: [82, 132],
    },
  },
  squat: {
    floorY: 154,
    from: {
      head: [120, 38],
      shoulder: [120, 60],
      hip: [120, 92],
      leftElbow: [98, 72],
      rightElbow: [142, 72],
      leftHand: [92, 92],
      rightHand: [148, 92],
      leftKnee: [102, 124],
      rightKnee: [138, 124],
      leftFoot: [92, 154],
      rightFoot: [148, 154],
    },
    to: {
      head: [120, 54],
      shoulder: [120, 78],
      hip: [120, 110],
      leftElbow: [90, 90],
      rightElbow: [150, 90],
      leftHand: [78, 108],
      rightHand: [162, 108],
      leftKnee: [98, 136],
      rightKnee: [142, 136],
      leftFoot: [90, 154],
      rightFoot: [150, 154],
    },
  },
  lunge: {
    floorY: 156,
    from: {
      head: [120, 38],
      shoulder: [120, 60],
      hip: [120, 92],
      leftElbow: [102, 74],
      rightElbow: [138, 74],
      leftHand: [98, 96],
      rightHand: [142, 96],
      leftKnee: [96, 122],
      rightKnee: [146, 122],
      leftFoot: [84, 156],
      rightFoot: [166, 156],
    },
    to: {
      head: [120, 52],
      shoulder: [120, 76],
      hip: [120, 104],
      leftElbow: [98, 90],
      rightElbow: [142, 90],
      leftHand: [92, 108],
      rightHand: [148, 108],
      leftKnee: [96, 138],
      rightKnee: [150, 132],
      leftFoot: [86, 156],
      rightFoot: [168, 156],
    },
  },
  plank: {
    floorY: 132,
    from: {
      head: [178, 72],
      shoulder: [154, 82],
      hip: [108, 84],
      leftElbow: [164, 98],
      rightElbow: [152, 96],
      leftHand: [170, 114],
      rightHand: [156, 114],
      leftKnee: [72, 88],
      rightKnee: [66, 90],
      leftFoot: [28, 92],
      rightFoot: [36, 96],
    },
    to: {
      head: [178, 74],
      shoulder: [154, 84],
      hip: [108, 88],
      leftElbow: [164, 100],
      rightElbow: [152, 98],
      leftHand: [170, 114],
      rightHand: [156, 114],
      leftKnee: [72, 92],
      rightKnee: [66, 94],
      leftFoot: [28, 96],
      rightFoot: [36, 100],
    },
  },
  dead_bug: {
    floorY: 134,
    from: {
      head: [120, 110],
      shoulder: [120, 94],
      hip: [120, 122],
      leftElbow: [96, 78],
      rightElbow: [144, 88],
      leftHand: [78, 62],
      rightHand: [168, 94],
      leftKnee: [102, 98],
      rightKnee: [140, 98],
      leftFoot: [78, 76],
      rightFoot: [162, 76],
    },
    to: {
      head: [120, 110],
      shoulder: [120, 94],
      hip: [120, 122],
      leftElbow: [96, 88],
      rightElbow: [144, 78],
      leftHand: [74, 96],
      rightHand: [168, 62],
      leftKnee: [100, 100],
      rightKnee: [142, 98],
      leftFoot: [76, 78],
      rightFoot: [164, 120],
    },
  },
  hollow_hold: {
    floorY: 136,
    from: {
      head: [120, 112],
      shoulder: [120, 98],
      hip: [120, 122],
      leftElbow: [92, 94],
      rightElbow: [148, 94],
      leftHand: [68, 90],
      rightHand: [172, 90],
      leftKnee: [102, 110],
      rightKnee: [138, 110],
      leftFoot: [78, 104],
      rightFoot: [162, 104],
    },
    to: {
      head: [120, 102],
      shoulder: [120, 90],
      hip: [120, 118],
      leftElbow: [92, 84],
      rightElbow: [148, 84],
      leftHand: [60, 76],
      rightHand: [180, 76],
      leftKnee: [98, 100],
      rightKnee: [142, 100],
      leftFoot: [68, 88],
      rightFoot: [172, 88],
    },
  },
  leg_raise: {
    floorY: 136,
    from: {
      head: [120, 114],
      shoulder: [120, 98],
      hip: [120, 122],
      leftElbow: [96, 94],
      rightElbow: [144, 94],
      leftHand: [80, 96],
      rightHand: [160, 96],
      leftKnee: [108, 104],
      rightKnee: [132, 104],
      leftFoot: [100, 74],
      rightFoot: [140, 74],
    },
    to: {
      head: [120, 114],
      shoulder: [120, 98],
      hip: [120, 122],
      leftElbow: [96, 94],
      rightElbow: [144, 94],
      leftHand: [80, 96],
      rightHand: [160, 96],
      leftKnee: [108, 120],
      rightKnee: [132, 120],
      leftFoot: [88, 126],
      rightFoot: [152, 126],
    },
  },
  mountain_climber: {
    floorY: 136,
    from: {
      head: [182, 70],
      shoulder: [158, 80],
      hip: [112, 86],
      leftElbow: [170, 88],
      rightElbow: [160, 88],
      leftHand: [202, 102],
      rightHand: [188, 102],
      leftKnee: [132, 104],
      rightKnee: [76, 92],
      leftFoot: [164, 112],
      rightFoot: [34, 98],
    },
    to: {
      head: [182, 70],
      shoulder: [158, 80],
      hip: [112, 86],
      leftElbow: [170, 88],
      rightElbow: [160, 88],
      leftHand: [202, 102],
      rightHand: [188, 102],
      leftKnee: [76, 92],
      rightKnee: [132, 104],
      leftFoot: [34, 98],
      rightFoot: [164, 112],
    },
  },
  superman: {
    floorY: 136,
    from: {
      head: [120, 114],
      shoulder: [120, 104],
      hip: [120, 122],
      leftElbow: [98, 108],
      rightElbow: [142, 108],
      leftHand: [72, 112],
      rightHand: [168, 112],
      leftKnee: [100, 126],
      rightKnee: [140, 126],
      leftFoot: [76, 132],
      rightFoot: [164, 132],
    },
    to: {
      head: [120, 100],
      shoulder: [120, 90],
      hip: [120, 114],
      leftElbow: [96, 84],
      rightElbow: [144, 84],
      leftHand: [62, 78],
      rightHand: [178, 78],
      leftKnee: [98, 118],
      rightKnee: [142, 118],
      leftFoot: [68, 110],
      rightFoot: [172, 110],
    },
  },
  jump_squat: {
    floorY: 156,
    from: {
      head: [120, 56],
      shoulder: [120, 80],
      hip: [120, 110],
      leftElbow: [90, 90],
      rightElbow: [150, 90],
      leftHand: [78, 110],
      rightHand: [162, 110],
      leftKnee: [98, 136],
      rightKnee: [142, 136],
      leftFoot: [90, 156],
      rightFoot: [150, 156],
    },
    to: {
      head: [120, 30],
      shoulder: [120, 54],
      hip: [120, 86],
      leftElbow: [92, 64],
      rightElbow: [148, 64],
      leftHand: [82, 84],
      rightHand: [158, 84],
      leftKnee: [100, 116],
      rightKnee: [140, 116],
      leftFoot: [90, 140],
      rightFoot: [150, 140],
    },
  },
  burpee: {
    floorY: 156,
    from: {
      head: [120, 38],
      shoulder: [120, 60],
      hip: [120, 92],
      leftElbow: [98, 74],
      rightElbow: [142, 74],
      leftHand: [92, 96],
      rightHand: [148, 96],
      leftKnee: [102, 124],
      rightKnee: [138, 124],
      leftFoot: [92, 156],
      rightFoot: [148, 156],
    },
    to: {
      head: [132, 82],
      shoulder: [128, 92],
      hip: [120, 114],
      leftElbow: [138, 106],
      rightElbow: [126, 106],
      leftHand: [150, 126],
      rightHand: [134, 126],
      leftKnee: [104, 128],
      rightKnee: [138, 128],
      leftFoot: [96, 156],
      rightFoot: [148, 156],
    },
  },
  bear_crawl: {
    floorY: 146,
    from: {
      head: [162, 72],
      shoulder: [146, 84],
      hip: [110, 88],
      leftElbow: [162, 102],
      rightElbow: [144, 94],
      leftHand: [180, 120],
      rightHand: [154, 112],
      leftKnee: [90, 110],
      rightKnee: [126, 118],
      leftFoot: [70, 138],
      rightFoot: [140, 138],
    },
    to: {
      head: [158, 74],
      shoulder: [142, 86],
      hip: [108, 90],
      leftElbow: [156, 96],
      rightElbow: [138, 104],
      leftHand: [168, 112],
      rightHand: [150, 122],
      leftKnee: [94, 118],
      rightKnee: [120, 110],
      leftFoot: [74, 138],
      rightFoot: [136, 138],
    },
  },
  crab_walk: {
    floorY: 148,
    from: {
      head: [86, 84],
      shoulder: [104, 92],
      hip: [122, 108],
      leftElbow: [78, 110],
      rightElbow: [122, 104],
      leftHand: [62, 136],
      rightHand: [140, 128],
      leftKnee: [108, 132],
      rightKnee: [146, 128],
      leftFoot: [92, 148],
      rightFoot: [170, 144],
    },
    to: {
      head: [90, 82],
      shoulder: [108, 90],
      hip: [126, 106],
      leftElbow: [82, 102],
      rightElbow: [126, 110],
      leftHand: [66, 124],
      rightHand: [144, 136],
      leftKnee: [112, 126],
      rightKnee: [150, 134],
      leftFoot: [96, 144],
      rightFoot: [174, 148],
    },
  },
};

function renderLimb(start: Point, mid: Point, end: Point) {
  return `M ${start[0]} ${start[1]} L ${mid[0]} ${mid[1]} L ${end[0]} ${end[1]}`;
}

function StickFigure({ pose, className }: { pose: Pose; className: string }) {
  return (
    <g className={className}>
      <circle cx={pose.head[0]} cy={pose.head[1]} r="10" className="fill-[#D6FFF0]" />
      <path d={`M ${pose.head[0]} ${pose.head[1] + 10} L ${pose.shoulder[0]} ${pose.shoulder[1]} L ${pose.hip[0]} ${pose.hip[1]}`} />
      <path d={renderLimb(pose.shoulder, pose.leftElbow, pose.leftHand)} />
      <path d={renderLimb(pose.shoulder, pose.rightElbow, pose.rightHand)} />
      <path d={renderLimb(pose.hip, pose.leftKnee, pose.leftFoot)} />
      <path d={renderLimb(pose.hip, pose.rightKnee, pose.rightFoot)} />
      <circle cx={pose.leftHand[0]} cy={pose.leftHand[1]} r="3.5" className="fill-[#D6FFF0]" />
      <circle cx={pose.rightHand[0]} cy={pose.rightHand[1]} r="3.5" className="fill-[#D6FFF0]" />
      <circle cx={pose.leftFoot[0]} cy={pose.leftFoot[1]} r="3.5" className="fill-[#D6FFF0]" />
      <circle cx={pose.rightFoot[0]} cy={pose.rightFoot[1]} r="3.5" className="fill-[#D6FFF0]" />
    </g>
  );
}

export function ExerciseMotionPreview({ demoKey }: { demoKey: ExerciseDemoKey }) {
  const scene = SCENES[demoKey];
  const floorY = scene.floorY ?? 150;

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/5 bg-[radial-gradient(circle_at_top,_rgba(110,231,183,0.18),_transparent_50%),linear-gradient(180deg,_rgba(10,13,19,1),_rgba(18,23,33,0.94))] p-4">
      <svg viewBox="0 0 240 180" className="h-64 w-full">
        <defs>
          <linearGradient id="fittrack-demo-floor" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(110,231,183,0.05)" />
            <stop offset="50%" stopColor="rgba(110,231,183,0.5)" />
            <stop offset="100%" stopColor="rgba(110,231,183,0.05)" />
          </linearGradient>
        </defs>

        <circle cx="120" cy="92" r="56" fill="rgba(110,231,183,0.08)" />
        <path d={`M 24 ${floorY} L 216 ${floorY}`} stroke="url(#fittrack-demo-floor)" strokeWidth="4" strokeLinecap="round" />

        <g
          className="stroke-[#D6FFF0] stroke-[5] opacity-95"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <StickFigure pose={scene.from} className="exercise-preview-from" />
          <StickFigure pose={scene.to} className="exercise-preview-to" />
        </g>
      </svg>

      <div className="pointer-events-none absolute right-4 top-4 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-300">
        Demo en loop
      </div>

      <style>{`
        @keyframes exercise-preview-from {
          0%, 40% { opacity: 1; }
          50%, 90% { opacity: 0.16; }
          100% { opacity: 1; }
        }

        @keyframes exercise-preview-to {
          0%, 40% { opacity: 0.16; }
          50%, 90% { opacity: 1; }
          100% { opacity: 0.16; }
        }

        .exercise-preview-from {
          animation: exercise-preview-from 3.8s ease-in-out infinite;
        }

        .exercise-preview-to {
          animation: exercise-preview-to 3.8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
