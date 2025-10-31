// api/_utils/missions.ts
import { Db } from 'mongodb';
import { DailyMissionType } from '../../types';

export async function updateDailyMissionProgress(db: Db, userId: string, missionType: DailyMissionType, amount: number) {
    const users = db.collection('users');
    const user = await users.findOne({ _id: userId as any });

    if (!user || !user.data.dailyMissions) {
        return;
    }
    
    let missionUpdated = false;
    const updatedMissions = user.data.dailyMissions.map((mission: any) => {
        if (mission.type === missionType && !mission.isClaimed) {
            mission.progress = Math.min((mission.progress || 0) + amount, mission.goal);
            missionUpdated = true;
        }
        return mission;
    });

    if (missionUpdated) {
        await users.updateOne(
            { _id: userId as any },
            { $set: { 'data.dailyMissions': updatedMissions } }
        );
    }
}
